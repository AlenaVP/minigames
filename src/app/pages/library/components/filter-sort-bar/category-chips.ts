import { ComponentBase } from '@app/core/component.base';
import type { Category } from '@shared/types/game';
import { enableDragScroll } from '@shared/utils/drag-scroll';
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
              value="${slug}"
              class="category-chips__input visually-hidden"
              ${slug === selected ? 'checked' : ''}
            />
            ${label}
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
}
