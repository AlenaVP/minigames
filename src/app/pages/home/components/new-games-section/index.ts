import { ComponentBase } from '@app/core/component.base';
import { GameCard, type GameCardData } from '@widgets/game-card';
import unoImg from '@assets/images/games/tailside.jpg';
import islandersImg from '@assets/images/games/islanders-new-shores.jpg';
import vacationCafeImg from '@assets/images/games/vacation-cafe.jpg';
import winterBurrowImg from '@assets/images/games/winter-burrow.jpg';
import candyCrushImg from '@assets/images/games/shelve-the-potions.jpg';
import './new-games-section.scss';

const GAMES: (GameCardData & { slot: string })[] = [
  { title: 'Uno Online', rating: 4.7, likes: '19.4K', imageUrl: unoImg, slot: 'peek-outer' },
  { title: 'Islanders: New Shores', rating: 4.9, likes: '54.2K', imageUrl: islandersImg, slot: 'peek-inner' },
  {
    title: 'Vacation Cafe Simulator: Brew, Serve & Relax',
    rating: 4.8,
    likes: '28.7K',
    imageUrl: vacationCafeImg,
    slot: 'featured',
  },
  { title: 'Winter Burrow', rating: 4.9, likes: '32.4K', imageUrl: winterBurrowImg, slot: 'peek-inner' },
  { title: 'Candy Crush', rating: 4.6, likes: '22.1K', imageUrl: candyCrushImg, slot: 'peek-outer' },
];

export class NewGamesSection extends ComponentBase {
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

    if (track) {
      for (const game of GAMES) {
        const { slot, ...data } = game;
        const card = new GameCard(data, `new-games__card--${slot}`);
        card.mount(track);
      }
    }

    return section;
  }
}
