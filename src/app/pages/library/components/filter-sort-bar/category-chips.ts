import { ComponentBase } from '@app/core/component.base';
import type { Category } from '@shared/types/game';
import { enableDragScroll } from '@shared/utils/drag-scroll';
import { escapeHtml } from '@shared/utils/escape-html';
import './category-chips.scss';

interface CategoryChipsOptions {
  categories: readonly Category[];
  selected: string;
  onChange: (slug: string) => void;
}

/**
 * Radio group styled as chips: single selection, arrow keys and the `change` event
 * come from the browser — no JS state needed to keep "only one active".
 */
export class CategoryChips extends ComponentBase {
  private options: CategoryChipsOptions;

  constructor(options: CategoryChipsOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const fieldset = document.createElement('fieldset');
    fieldset.classList.add('category-chips');

    const { categories, selected } = this.options;

    fieldset.innerHTML = `
      <legend class="visually-hidden">Filter games by category</legend>
      <div class="category-chips__track">
        ${categories
          .map(
            ({ slug, label }) => `
          <label class="category-chips__chip">
            <input
              type="radio"
              name="category"
              value="${escapeHtml(slug)}"
              class="category-chips__input visually-hidden"
              ${slug === selected ? 'checked' : ''}
            />
            ${escapeHtml(label)}
          </label>`,
          )
          .join('')}
      </div>
    `;

    fieldset.addEventListener('change', (event) => {
      if (event.target instanceof HTMLInputElement) this.options.onChange(event.target.value);
    });

    const track = fieldset.querySelector<HTMLElement>('.category-chips__track');
    if (track) enableDragScroll(track, this.destroySignal);

    return fieldset;
  }

  /** Outside change (state resolved by the page, later Back/Forward): no `change` event, no onChange */
  select(slug: string): void {
    for (const input of this.element?.querySelectorAll<HTMLInputElement>('.category-chips__input') ?? []) {
      input.checked = input.value === slug;
    }
  }
}

/** Seven chip-shaped placeholders (the API list is short and stable) in the same track as the real chips */
export function renderCategoryChipsSkeleton(): HTMLElement {
  const placeholders = ['All Games', 'Puzzle', 'Card', 'Match', 'Farm', 'Strategy', 'Arcade'];

  const element = document.createElement('div');
  element.classList.add('category-chips');
  element.innerHTML = `
    <div class="category-chips__track">
      ${placeholders.map((label) => `<span class="category-chips__chip category-chips__chip--skeleton skeleton">${label}</span>`).join('')}
    </div>
  `;
  return element;
}
