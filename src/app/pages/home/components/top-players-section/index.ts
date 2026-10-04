import { ComponentBase } from '@app/core/component.base';
import { catalogApi } from '@app/services/api';
import { AsyncContent } from '@shared/ui/async-content';
import { EmptyState } from '@shared/ui/empty-state';
import type { LeaderboardEntry } from '@shared/types/leaderboard';
import { renderLeaderboardSkeleton, renderLeaderboardTable } from './leaderboard-table';
import './top-players-section.scss';

/** Home "Top Players This Week": GET /api/leaderboard */
export class TopPlayersSection extends ComponentBase {
  protected render(): HTMLElement {
    const section = document.createElement('section');
    section.classList.add('top-players');
    section.setAttribute('aria-labelledby', 'top-players-title');

    section.innerHTML = `
      <div class="top-players__inner">
        <div class="top-players__heading">
          <span class="top-players__accent" aria-hidden="true"></span>
          <h2 id="top-players-title" class="top-players__title">
            <span class="top-players__title-text top-players__title-text--compact">Top Players</span>
            <span class="top-players__title-text top-players__title-text--extended">Top Players This Week</span>
          </h2>
        </div>
      </div>
    `;

    const inner = section.querySelector<HTMLElement>('.top-players__inner');
    if (!inner) return section;

    this.mountChild(
      new AsyncContent<readonly LeaderboardEntry[]>({
        label: 'top players',
        request: (signal) => catalogApi.getLeaderboard(signal),
        isEmpty: (entries) => entries.length === 0,
        renderSkeleton: renderLeaderboardSkeleton,
        renderContent: renderLeaderboardTable,
        renderEmpty: () =>
          new EmptyState({ title: 'No players yet', message: 'The leaderboard fills up as soon as someone plays.' }),
      }),
      inner,
    );

    return section;
  }
}
