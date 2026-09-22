import { ComponentBase } from '@app/core/component.base';
import './top-players-section.scss';

interface Player {
  rank: number;
  initials: string;
  name: string;
  games: number;
  score: string; // "94,250"
  scoreShort: string; // "94.2K"
  streakDays: number;
  favoriteGame: string;
}

const PLAYERS: Player[] = [
  {
    rank: 1,
    initials: 'AP',
    name: 'Alex_Pro99',
    games: 142,
    score: '94,250',
    scoreShort: '94.2K',
    streakDays: 12,
    favoriteGame: 'Heartopia',
  },
  {
    rank: 2,
    initials: 'CG',
    name: 'CozyGamer_x',
    games: 118,
    score: '81,400',
    scoreShort: '81.4K',
    streakDays: 8,
    favoriteGame: 'Cat Mail Co.',
  },
  {
    rank: 3,
    initials: 'MM',
    name: 'MatchMaster',
    games: 98,
    score: '72,110',
    scoreShort: '72.1K',
    streakDays: 5,
    favoriteGame: 'Tiny Glade',
  },
  {
    rank: 4,
    initials: 'BP',
    name: 'BubblePop',
    games: 87,
    score: '65,900',
    scoreShort: '65.9K',
    streakDays: 3,
    favoriteGame: 'Whisper of the House',
  },
  {
    rank: 5,
    initials: 'SG',
    name: 'SudokuGod',
    games: 74,
    score: '59,320',
    scoreShort: '59.3K',
    streakDays: 2,
    favoriteGame: 'Cat Chess',
  },
];

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

        <div class="top-players__table-wrapper">
          <table class="top-players__table">
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
            <tbody>
              ${PLAYERS.map(
                (player) => `
                <tr class="top-players__row${player.rank > 3 ? ' top-players__row--desktop-only' : ''}">
                  <td class="top-players__rank${player.rank === 1 ? ' top-players__rank--first' : ''}">#${player.rank}</td>
                  <td>
                    <div class="top-players__player">
                      <span class="top-players__avatar top-players__avatar--${player.rank}">${player.initials}</span>
                      <span>${player.name}</span>
                    </div>
                  </td>
                  <td class="top-players__col--games">${player.games}</td>
                  <td>
                    <span class="top-players__score-text top-players__score-text--compact">${player.scoreShort}</span>
                    <span class="top-players__score-text top-players__score-text--extended">${player.score}</span>
                  </td>
                  <td class="top-players__streak">
                    🔥
                    <span class="top-players__label--short">${player.streakDays}d</span>
                    <span class="top-players__label--full">${player.streakDays} days</span>
                  </td>
                  <td class="top-players__col--favorite">
                    <span class="top-players__badge">${player.favoriteGame}</span>
                  </td>
                </tr>`,
              ).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    return section;
  }
}
