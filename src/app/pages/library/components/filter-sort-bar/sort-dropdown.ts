import { ComponentBase } from '@app/core/component.base';
import type { SortOption, SortValue } from '@shared/types/game';
import './sort-dropdown.scss';

interface SortDropdownOptions {
  /** Unique prefix for ids and the CSS anchor name */
  id: string;
  options: readonly SortOption[];
  selected: SortValue;
  onChange: (value: SortValue) => void;
}

const CHECK_ICON = `
  <svg class="sort-dropdown__check" width="16" height="16" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
    <path d="M9 16.2 4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4z" fill="currentColor" />
  </svg>`;

// Visible text with arrows is hidden from screen readers; they get srLabel instead
function renderLabel(option: SortOption): string {
  return `<span aria-hidden="true">${option.label}</span><span class="visually-hidden">${option.srLabel}</span>`;
}

/**
 * Trigger + listbox shown via the Popover API:
 * open/close, Esc, click-outside and the top layer come from the browser;
 * this class only handles selection and arrow-key focus.
 */
export class SortDropdown extends ComponentBase {
  private options: SortDropdownOptions;
  private selected: SortValue;
  private trigger: HTMLButtonElement | null = null;
  private list: HTMLUListElement | null = null;

  constructor(options: SortDropdownOptions) {
    super();
    this.options = options;
    this.selected = options.selected;
  }

  protected render(): HTMLElement {
    const { id, options } = this.options;
    const listId = `${id}-list`;

    const root = document.createElement('div');
    root.classList.add('sort-dropdown');
    // CSS anchor positioning: the list is attached to the trigger even though it lives in the top layer
    root.style.setProperty('--sort-anchor', `--${id}`);

    root.innerHTML = `
      <button
        type="button"
        class="sort-dropdown__trigger"
        popovertarget="${listId}"
        aria-haspopup="listbox"
      >
        Sort by: <span class="sort-dropdown__value"></span>
      </button>
      <ul id="${listId}" class="sort-dropdown__list" role="listbox" aria-label="Sort games" popover>
        ${options
          .map(
            (option) => `
          <li
            id="${id}-${option.value}"
            class="sort-dropdown__option"
            role="option"
            tabindex="-1"
            data-value="${option.value}"
          >${CHECK_ICON}${renderLabel(option)}</li>`,
          )
          .join('')}
      </ul>
    `;

    this.trigger = root.querySelector<HTMLButtonElement>('.sort-dropdown__trigger');
    this.list = root.querySelector<HTMLUListElement>('.sort-dropdown__list');
    this.syncSelection();
    this.bindEvents();

    return root;
  }

  private get optionElements(): HTMLLIElement[] {
    return [...(this.list?.querySelectorAll<HTMLLIElement>('[role="option"]') ?? [])];
  }

  private bindEvents(): void {
    const { list } = this;
    if (!list) return;

    // ToggleEvent fires after the popover opened/closed
    list.addEventListener('toggle', (event) => {
      if (event.newState === 'open') {
        this.optionElements.find((option) => option.dataset.value === this.selected)?.focus();
      }
    });

    list.addEventListener('click', (event) => {
      const option = event.target instanceof Element ? event.target.closest<HTMLLIElement>('[role="option"]') : null;
      if (option) this.select(option);
    });

    list.addEventListener('keydown', (event) => this.handleKeydown(event));
  }

  private handleKeydown(event: KeyboardEvent): void {
    const options = this.optionElements;
    const currentIndex = options.indexOf(document.activeElement as HTMLLIElement);
    const focusAt = (index: number): void => options.at(index)?.focus();

    switch (event.key) {
      case 'ArrowDown': {
        focusAt((currentIndex + 1) % options.length);
        break;
      }
      case 'ArrowUp': {
        focusAt((currentIndex - 1 + options.length) % options.length);
        break;
      }
      case 'Home': {
        focusAt(0);
        break;
      }
      case 'End': {
        focusAt(-1);
        break;
      }
      case 'Enter':
      case ' ': {
        if (options[currentIndex]) this.select(options[currentIndex]);
        break;
      }
      case 'Tab': {
        this.list?.hidePopover();
        return; // do not prevent: focus continues to the next element
      }
      default: {
        return;
      }
    }

    event.preventDefault(); // no page scroll on arrows/Space
  }

  private select(option: HTMLLIElement): void {
    const value = this.options.options.find((item) => item.value === option.dataset.value)?.value;

    this.list?.hidePopover();
    this.trigger?.focus();

    if (!value || value === this.selected) return;

    this.selected = value;
    this.syncSelection();
    this.options.onChange(value);
  }

  private syncSelection(): void {
    const selectedOption = this.options.options.find((option) => option.value === this.selected);
    const valueElement = this.trigger?.querySelector('.sort-dropdown__value');

    if (selectedOption && valueElement) valueElement.innerHTML = renderLabel(selectedOption);

    for (const option of this.optionElements) {
      option.setAttribute('aria-selected', String(option.dataset.value === this.selected));
    }
  }
}
