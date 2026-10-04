import { ComponentBase } from '@app/core/component.base';
import type { TopRecord } from '@shared/types/game-details';
import { escapeHtml } from '@shared/utils/escape-html';
import { formatRelativeTime, formatScore } from '@shared/utils/format';
import './top-records.scss';

interface TopRecordsOptions {
  records: readonly TopRecord[];
  /** The moment "ago" is counted from; the real clock by default */
  now?: Date;
}

const TITLE_ID = 'top-records-title';
const MEDALS: Record<number, string> = { 1: '🥇', 2: '🥈', 3: '🥉' };

/** Informational only (2-2-5): no buttons, links or hover states. */
export class TopRecords extends ComponentBase {
  private options: TopRecordsOptions;

  constructor(options: TopRecordsOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { records, now } = this.options;

    const section = document.createElement('section');
    section.classList.add('top-records');
    section.setAttribute('aria-labelledby', TITLE_ID);

    section.innerHTML = `
      <h3 id="${TITLE_ID}" class="top-records__title">
        <span aria-hidden="true">🏆</span>
        Top Records
      </h3>
      ${records.length === 0 ? '<p class="top-records__empty">No records yet — be the first to set one.</p>' : ''}
      <ol class="top-records__list"${records.length === 0 ? ' hidden' : ''}>
        ${records
          .map(
            ({ position, playerName, score, achievedAt }) => `
          <li class="top-records__item">
            <span class="top-records__medal" aria-hidden="true">${MEDALS[position] ?? position}</span>
            <span class="top-records__player">${escapeHtml(playerName)}</span>
            <span class="top-records__score">${formatScore(score)}</span>
            <time class="top-records__date" datetime="${escapeHtml(achievedAt)}">${formatRelativeTime(achievedAt, now)}</time>
          </li>`,
          )
          .join('')}
      </ol>
    `;

    return section;
  }
}
