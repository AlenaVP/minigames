import type { LeaderboardEntry } from '@shared/types/leaderboard';
import { getPlayerInitials } from '@shared/utils/avatar';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatCompactNumber, formatInteger } from '@shared/utils/format';

/** Figma: 3 rows below 1024px, all 5 from desktop */
const ALWAYS_VISIBLE_ROWS = 3;
/** Avatar colours in the stylesheet: top-players__avatar--1 … --5 */
const AVATAR_COLOR_COUNT = 5;
/** The API always returns the top 5 */
const SKELETON_ROWS = 5;

const TABLE_HEAD = `
  <thead>
    <tr>
      <th>Rank</th>
      <th>Player</th>
      <th class="top-players__col--games">
        <span class="top-players__label--short">Games</span>
        <span class="top-players__label--full">Games Played</span>
      </th>
      <th>
        <span class="top-players__label--short">Score</span>
        <span class="top-players__label--full">Total Score</span>
      </th>
      <th>Streak</th>
      <th class="top-players__col--favorite">Favorite Game</th>
    </tr>
  </thead>
`;

function rowClass(index: number): string {
  return `top-players__row${index >= ALWAYS_VISIBLE_ROWS ? ' top-players__row--desktop-only' : ''}`;
}

function renderRow(entry: LeaderboardEntry, index: number): string {
  const { rank, playerName, gamesPlayed, totalScore, streakDays, favoriteGameName } = entry;
  const avatarColor = ((rank - 1) % AVATAR_COLOR_COUNT) + 1;

  return `
    <tr class="${rowClass(index)}">
      <td class="top-players__rank${rank === 1 ? ' top-players__rank--first' : ''}">#${rank}</td>
      <td>
        <div class="top-players__player">
          <span class="top-players__avatar top-players__avatar--${avatarColor}" aria-hidden="true">${escapeHtml(getPlayerInitials(playerName))}</span>
          <span>${escapeHtml(playerName)}</span>
        </div>
      </td>
      <td class="top-players__col--games">${formatInteger(gamesPlayed)}</td>
      <td>
        <span class="top-players__score-text top-players__score-text--compact">${formatCompactNumber(totalScore)}</span>
        <span class="top-players__score-text top-players__score-text--extended">${formatInteger(totalScore)}</span>
      </td>
      <td class="top-players__streak">
        🔥
        <span class="top-players__label--short">${streakDays}d</span>
        <span class="top-players__label--full">${streakDays} ${streakDays === 1 ? 'day' : 'days'}</span>
      </td>
      <td class="top-players__col--favorite">
        <span class="top-players__badge">${escapeHtml(favoriteGameName)}</span>
      </td>
    </tr>
  `;
}

/** Same frame and header as the real table, bars instead of values → no layout jump when the data arrives */
function renderSkeletonRow(index: number): string {
  return `
    <tr class="${rowClass(index)}">
      <td><span class="skeleton top-players__skeleton top-players__skeleton--rank"></span></td>
      <td>
        <div class="top-players__player">
          <span class="skeleton top-players__avatar top-players__skeleton--avatar"></span>
          <span class="skeleton top-players__skeleton"></span>
        </div>
      </td>
      <td class="top-players__col--games"><span class="skeleton top-players__skeleton"></span></td>
      <td><span class="skeleton top-players__skeleton"></span></td>
      <td><span class="skeleton top-players__skeleton"></span></td>
      <td class="top-players__col--favorite"><span class="skeleton top-players__skeleton top-players__skeleton--badge"></span></td>
    </tr>
  `;
}

function wrapTable(body: string): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.classList.add('top-players__table-wrapper');
  wrapper.innerHTML = `<table class="top-players__table">${TABLE_HEAD}<tbody>${body}</tbody></table>`;
  return wrapper;
}

export function renderLeaderboardTable(entries: readonly LeaderboardEntry[]): HTMLElement {
  return wrapTable(entries.map((entry, index) => renderRow(entry, index)).join(''));
}

export function renderLeaderboardSkeleton(): HTMLElement {
  return wrapTable(Array.from({ length: SKELETON_ROWS }, (_, index) => renderSkeletonRow(index)).join(''));
}
