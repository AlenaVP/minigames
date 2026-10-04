import { ComponentBase } from '@app/core/component.base';
import type { Category, GameSummary } from '@shared/types/game';
import { LibraryGameCard, renderLibraryGameCardSkeleton } from './library-game-card';
import './game-cards-section.scss';

interface GameCardsSectionOptions {
  games: readonly GameSummary[];
  categories: readonly Category[];
  onDetailsClick: (slug: string) => void;
}

export class GameCardsSection extends ComponentBase {
  private options: GameCardsSectionOptions;

  constructor(options: GameCardsSectionOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const list = document.createElement('ul');
    list.classList.add('game-cards');

    const { games, categories, onDetailsClick } = this.options;
    const labelBySlug = new Map(categories.map(({ slug, label }) => [slug, label]));

    for (const game of games) {
      this.mountChild(
        new LibraryGameCard({ game, categoryLabel: labelBySlug.get(game.category) ?? game.category, onDetailsClick }),
        list,
      );
    }

    return list;
  }
}

/** The same grid as the real list, `count` card-shaped placeholders */
export function renderGameCardsSkeleton(count: number): HTMLElement {
  const list = document.createElement('ul');
  list.classList.add('game-cards');
  list.innerHTML = Array.from({ length: count }, () => renderLibraryGameCardSkeleton()).join('');
  return list;
}
