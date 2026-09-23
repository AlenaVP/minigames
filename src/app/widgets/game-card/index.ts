import { ComponentBase } from '@app/core/component.base';
import starIconUrl from '@assets/icons/star.svg';
import favoriteIconUrl from '@assets/icons/favorite.svg';
import './game-card.scss';

export interface GameCardData {
  title: string;
  rating: number;
  likes: string;
  imageUrl?: string;
}

export class GameCard extends ComponentBase {
  private data: GameCardData;
  private modifierClass?: string;

  constructor(data: GameCardData, modifierClass?: string) {
    super();
    this.data = data;
    this.modifierClass = modifierClass;
  }

  protected render(): HTMLElement {
    const card = document.createElement('li');
    card.classList.add('game-card');
    if (this.modifierClass) card.classList.add(this.modifierClass);

    const media = this.data.imageUrl
      ? `<img src="${this.data.imageUrl}" alt="" class="game-card__image" />`
      : `<div class="game-card__placeholder" role="img" aria-label="${this.data.title}"></div>`;

    card.innerHTML = `
      <div class="game-card__inner">
        ${media}
        <div class="game-card__overlay">
          <p class="game-card__title">${this.data.title}</p>
          <div class="game-card__meta">
            <span class="game-card__rating">
              <img src="${starIconUrl}" alt="" class="game-card__icon" />
              ${this.data.rating.toFixed(1)}
            </span>
            <span class="game-card__likes">
              <img src="${favoriteIconUrl}" alt="" class="game-card__icon" />
              ${this.data.likes}
            </span>
          </div>
        </div>
      </div>
    `;

    return card;
  }
}
