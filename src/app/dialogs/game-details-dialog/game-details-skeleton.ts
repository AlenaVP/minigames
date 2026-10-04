/**
 * Placeholder for the details request: the real hero / info / records classes with invisible text
 * (`.skeleton-text`), so the boxes have the size the real content will have.
 */
export function renderGameDetailsSkeleton(): HTMLElement {
  const specs = ['Genre', 'Players', 'Duration', 'Price']
    .map(
      (label) => `
        <div class="game-info__spec">
          <dt class="game-info__spec-label"><span class="skeleton-text">${label}</span></dt>
          <dd class="game-info__spec-value"><span class="skeleton-text">Loading</span></dd>
        </div>`,
    )
    .join('');

  const records = ['🥇', '🥈', '🥉']
    .map(
      () => `
        <li class="top-records__item">
          <span class="top-records__medal"><span class="skeleton-text">🥇</span></span>
          <span class="top-records__player"><span class="skeleton-text">PlayerName</span></span>
          <span class="top-records__score"><span class="skeleton-text">000,000 pts</span></span>
          <span class="top-records__date"><span class="skeleton-text">2 days ago</span></span>
        </li>`,
    )
    .join('');

  const skeleton = document.createElement('div');
  skeleton.classList.add('game-details__skeleton');
  skeleton.innerHTML = `
    <div class="game-details-hero"><span class="game-details-hero__image skeleton"></span></div>
    <div class="game-details__body">
      <div class="game-info">
        <div class="game-info__heading">
          <p class="game-info__title"><span class="skeleton-text">Game title</span></p>
          <p class="game-info__stats"><span class="skeleton-text">★ 4.9 ♥ 31.2K</span></p>
        </div>
        <p class="game-info__description">
          <span class="skeleton-text">
            A placeholder for the full description of the game. It is long enough to take three or four lines
            in the dialog, the way the real text of a cozy little game usually does, so nothing jumps when the
            data comes in and the real paragraph takes its place.
          </span>
        </p>
        <dl class="game-info__specs">${specs}</dl>
        <div class="game-info__actions">
          <span class="game-info__action game-info__action--skeleton skeleton">Play Now</span>
          <span class="game-info__action game-info__action--favorite game-info__action--skeleton skeleton"></span>
        </div>
      </div>
      <section class="top-records">
        <p class="top-records__title"><span class="skeleton-text">🏆 Top Records</span></p>
        <ol class="top-records__list">${records}</ol>
      </section>
    </div>
  `;
  return skeleton;
}
