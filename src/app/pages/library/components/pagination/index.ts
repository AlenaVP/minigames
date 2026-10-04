import { ComponentBase } from '@app/core/component.base';
import { MEDIA_QUERIES } from '@app/core/constants/breakpoints';
import { getVisiblePages } from '@shared/utils/pagination';
import './pagination.scss';

interface PaginationOptions {
  onPageChange: (page: number) => void;
}

export interface PaginationState {
  currentPage: number;
  totalPages: number;
}

const MAX_VISIBLE_MOBILE = 3;
const MAX_VISIBLE_TABLET_UP = 4;

const CHEVRON_LEFT = 'M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z';
const CHEVRON_RIGHT = 'M10 6 8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z';

function renderChevron(path: string): string {
  return `<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}" fill="currentColor" /></svg>`;
}

/**
 * Built from the API response meta (page, totalPages) via setState().
 * Even an empty result shows page "1" with both arrows disabled (3-2-4).
 */
export class Pagination extends ComponentBase {
  private readonly options: PaginationOptions;
  private currentPage = 1;
  private totalPages = 1;
  private maxVisible = MAX_VISIBLE_MOBILE;
  private list: HTMLUListElement | null = null;
  private previousButton: HTMLButtonElement | null = null;
  private nextButton: HTMLButtonElement | null = null;

  constructor(options: PaginationOptions) {
    super();
    this.options = options;
  }

  /** totalPages 0 (empty list) is shown as a single page */
  setState({ currentPage, totalPages }: PaginationState): void {
    this.totalPages = Math.max(1, totalPages);
    this.currentPage = Math.min(Math.max(currentPage, 1), this.totalPages);
    this.update();
  }

  /** Hidden until the first response, and while the list shows an error */
  setVisible(visible: boolean): void {
    if (this.element) this.element.hidden = !visible;
  }

  protected render(): HTMLElement {
    const nav = document.createElement('nav');
    nav.classList.add('pagination');
    nav.setAttribute('aria-label', 'Pagination');
    nav.hidden = true;

    nav.innerHTML = `
      <button type="button" class="pagination__arrow" data-page="previous" aria-label="Previous page">
        ${renderChevron(CHEVRON_LEFT)}
      </button>
      <ul class="pagination__list"></ul>
      <button type="button" class="pagination__arrow" data-page="next" aria-label="Next page">
        ${renderChevron(CHEVRON_RIGHT)}
      </button>
    `;

    this.list = nav.querySelector('.pagination__list');
    this.previousButton = nav.querySelector('[data-page="previous"]');
    this.nextButton = nav.querySelector('[data-page="next"]');

    const tabletQuery = globalThis.matchMedia(MEDIA_QUERIES.tablet);
    this.maxVisible = tabletQuery.matches ? MAX_VISIBLE_TABLET_UP : MAX_VISIBLE_MOBILE;
    tabletQuery.addEventListener(
      'change',
      (event) => {
        this.maxVisible = event.matches ? MAX_VISIBLE_TABLET_UP : MAX_VISIBLE_MOBILE;
        this.update();
      },
      { signal: this.destroySignal },
    );

    nav.addEventListener('click', (event) => this.handleClick(event));

    this.update();
    return nav;
  }

  private handleClick(event: MouseEvent): void {
    const button = event.target instanceof Element ? event.target.closest<HTMLButtonElement>('button[data-page]') : null;
    if (!button || button.disabled) return;

    const { page } = button.dataset;
    if (page === 'previous') this.goTo(this.currentPage - 1);
    else if (page === 'next') this.goTo(this.currentPage + 1);
    else this.goTo(Number(page));
  }

  private goTo(page: number): void {
    const target = Math.min(Math.max(page, 1), this.totalPages);
    if (target === this.currentPage) return;

    this.currentPage = target;
    this.update();
    this.options.onPageChange(target);
  }

  /** Renders the visible page window and the enabled/disabled state of the arrows. */
  private update(): void {
    const { list, previousButton, nextButton } = this;
    if (!list || !previousButton || !nextButton) return;

    const focused = document.activeElement;
    const hadFocusOnPage = focused instanceof HTMLElement && list.contains(focused);

    list.innerHTML = getVisiblePages(this.currentPage, this.totalPages, this.maxVisible)
      .map((page) => {
        const current = page === this.currentPage ? ' aria-current="page"' : '';
        return `<li><button type="button" class="pagination__page" data-page="${page}" aria-label="Page ${page}"${current}>${page}</button></li>`;
      })
      .join('');

    previousButton.disabled = this.currentPage === 1;
    nextButton.disabled = this.currentPage === this.totalPages;

    const lostFocus = hadFocusOnPage || (focused instanceof HTMLButtonElement && focused.disabled);
    if (lostFocus) list.querySelector<HTMLButtonElement>('[aria-current="page"]')?.focus();
  }
}
