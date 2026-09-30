import { ComponentBase } from '@app/core/component.base';
import { FEATURED_GAMES_MOCK } from '@app/services/mock-data/games.mock';
import { GameCard } from '@widgets/game-card';
import './new-games-section.scss';

interface NewGamesSectionOptions {
  onGameDetails: (slug: string) => void;
}

const START_INDEX = 0;
const SLOTS = [
  { offset: -2, slot: 'peek-outer' },
  { offset: -1, slot: 'peek-inner' },
  { offset: 0, slot: 'featured' },
  { offset: 1, slot: 'peek-inner' },
  { offset: 2, slot: 'peek-outer' },
] as const;

export class NewGamesSection extends ComponentBase {
  private options: NewGamesSectionOptions;

  constructor(options: NewGamesSectionOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const section = document.createElement('section');
    section.classList.add('new-games');
    section.setAttribute('aria-labelledby', 'new-games-title');

    section.innerHTML = `
      <div class="new-games__inner">
        <div class="new-games__header">
          <div class="new-games__heading">
            <span class="new-games__accent" aria-hidden="true"></span>
            <h2 id="new-games-title" class="new-games__title">New Games</h2>
          </div>

          <div class="new-games__nav">
            <button type="button" class="new-games__nav-btn" aria-label="Previous game">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.825 9L9.425 14.6L8 16L1.19209e-07 8L8 -9.53674e-07L9.425 1.4L3.825 7H16V9H3.825Z" fill="currentColor"/>
              </svg>
            </button>
            <button type="button" class="new-games__nav-btn" aria-label="Next game">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.175 9H1.19209e-07V7H12.175L6.575 1.4L8 -9.53674e-07L16 8L8 16L6.575 14.6L12.175 9Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="new-games__viewport">
          <ul class="new-games__track"></ul>
        </div>
      </div>
    `;

    const track = section.querySelector<HTMLUListElement>('.new-games__track');
    const games = FEATURED_GAMES_MOCK;

    if (track) {
      for (const { offset, slot } of SLOTS) {
        const game = games[(START_INDEX + offset + games.length) % games.length];

        this.mountChild(
          new GameCard({ game, onClick: this.options.onGameDetails, className: `new-games__card--${slot}` }),
          track,
        );
      }
    }

    return section;
  }
}
