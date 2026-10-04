import { ComponentBase } from '@app/core/component.base';
import { gamesApi } from '@app/services/api';
import { AsyncContent } from '@shared/ui/async-content';
import { EmptyState } from '@shared/ui/empty-state';
import type { GameSummary } from '@shared/types/game';
import { FeaturedCarousel, renderFeaturedCarouselSkeleton } from './featured-carousel';
import './new-games-section.scss';

interface NewGamesSectionOptions {
  onGameDetails: (slug: string) => void;
}

/** The API always returns 9 featured games — the skeleton reserves the same slots */
const SKELETON_SLOTS = 9;

/**
 * Home "New Games" slider: GET /api/games?featured=true.
 * The header (title + arrows) is always there; the cards area goes skeleton → slider | empty | error.
 */
export class NewGamesSection extends ComponentBase {
  private readonly options: NewGamesSectionOptions;
  private carousel: FeaturedCarousel | null = null;
  private navButtons: HTMLButtonElement[] = [];

  constructor(options: NewGamesSectionOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const section = document.createElement('section');
    section.classList.add('new-games');
    section.setAttribute('aria-labelledby', 'new-games-title');
    section.setAttribute('aria-roledescription', 'carousel'); // APG carousel pattern

    section.innerHTML = `
      <div class="new-games__inner">
        <div class="new-games__header">
          <div class="new-games__heading">
            <span class="new-games__accent" aria-hidden="true"></span>
            <h2 id="new-games-title" class="new-games__title">New Games</h2>
          </div>

          <div class="new-games__nav">
            <button type="button" class="new-games__nav-btn" data-direction="prev" aria-label="Previous game" disabled>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.825 9L9.425 14.6L8 16L1.19209e-07 8L8 -9.53674e-07L9.425 1.4L3.825 7H16V9H3.825Z" fill="currentColor"/>
              </svg>
            </button>
            <button type="button" class="new-games__nav-btn" data-direction="next" aria-label="Next game" disabled>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.175 9H1.19209e-07V7H12.175L6.575 1.4L8 -9.53674e-07L16 8L8 16L6.575 14.6L12.175 9Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    `;

    const inner = section.querySelector<HTMLElement>('.new-games__inner');
    if (!inner) return section;

    this.navButtons = [...section.querySelectorAll<HTMLButtonElement>('.new-games__nav-btn')];
    this.bindArrows(section);

    this.mountChild(
      new AsyncContent<readonly GameSummary[]>({
        label: 'new games',
        request: (signal) => gamesApi.getFeatured(signal),
        isEmpty: (games) => games.length === 0,
        renderSkeleton: () => renderFeaturedCarouselSkeleton(SKELETON_SLOTS),
        renderContent: (games) => {
          this.carousel = new FeaturedCarousel({ games, onGameDetails: this.options.onGameDetails });
          return this.carousel;
        },
        renderEmpty: () =>
          new EmptyState({ title: 'No new games yet', message: 'Check back soon — new games arrive regularly.' }),
        onStateChange: (state) => {
          // The carousel component exists only in the success state
          if (state.status !== 'success') this.carousel = null;
          this.setArrowsEnabled(this.carousel?.canScroll ?? false);
        },
      }),
      inner,
    );

    return section;
  }

  private bindArrows(section: HTMLElement): void {
    section.querySelector('.new-games__nav')?.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-direction]') : null;
      if (!button) return;

      if (button.dataset.direction === 'next') this.carousel?.next();
      if (button.dataset.direction === 'prev') this.carousel?.prev();
    });
  }

  private setArrowsEnabled(enabled: boolean): void {
    for (const button of this.navButtons) button.disabled = !enabled;
  }
}
