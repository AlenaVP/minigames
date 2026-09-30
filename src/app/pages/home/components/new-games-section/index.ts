import { ComponentBase } from '@app/core/component.base';
import { FEATURED_GAMES_MOCK } from '@app/services/mock-data/games.mock';
import { getSlotOffsets, wrapIndex } from '@shared/utils/carousel';
import { PausableTimer } from '@shared/utils/pausable-timer';
import { GameCard } from '@widgets/game-card';
import { Carousel } from './carousel';
import { attachSwipe } from './swipe';
import './new-games-section.scss';

interface NewGamesSectionOptions {
  onGameDetails: (slug: string) => void;
}

// The first featured game starts in the center; its neighbours wrap around the list — as in Figma
const START_INDEX = 0;
const AUTOPLAY_INTERVAL_MS = 4000;

/**
 * Several things can pause the autoplay at once (e.g. a hold while the tab gets hidden):
 * it resumes only when ALL of them are gone.
 */
type PauseReason = 'press' | 'hidden-tab' | 'dialog';

export class NewGamesSection extends ComponentBase {
  private options: NewGamesSectionOptions;
  private carousel: Carousel | null = null;
  private readonly pauseReasons = new Set<PauseReason>();

  private readonly autoplay: PausableTimer;

  constructor(options: NewGamesSectionOptions) {
    super();
    this.options = options;
    // 2-3-1: one step right → left every 4 s
    this.autoplay = new PausableTimer(() => this.autoplayStep(), AUTOPLAY_INTERVAL_MS);
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
            <button type="button" class="new-games__nav-btn" data-direction="prev" aria-label="Previous game">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M3.825 9L9.425 14.6L8 16L1.19209e-07 8L8 -9.53674e-07L9.425 1.4L3.825 7H16V9H3.825Z" fill="currentColor"/>
              </svg>
            </button>
            <button type="button" class="new-games__nav-btn" data-direction="next" aria-label="Next game">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
                <path d="M12.175 9H1.19209e-07V7H12.175L6.575 1.4L8 -9.53674e-07L16 8L8 16L6.575 14.6L12.175 9Z" fill="currentColor"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="new-games__viewport">
          <ul class="new-games__track" aria-live="off"></ul>
        </div>
      </div>
    `;

    const track = section.querySelector<HTMLUListElement>('.new-games__track');
    if (!track) return section;

    const games = FEATURED_GAMES_MOCK;

    // All 9 cards, already in the visual order: offsets −4 … +4 around START_INDEX
    for (const offset of getSlotOffsets(games.length)) {
      const gameIndex = wrapIndex(START_INDEX + offset, games.length);

      this.mountChild(
        new GameCard({ game: games[gameIndex], onClick: this.options.onGameDetails, className: 'new-games__card' }),
        track,
      );

      const slide = track.lastElementChild;
      slide?.setAttribute('aria-roledescription', 'slide');
      slide?.setAttribute('aria-label', `${gameIndex + 1} of ${games.length}`);
    }

    this.carousel = new Carousel(track, START_INDEX, this.destroySignal);
    this.bindControls(section);
    this.startAutoplay();

    return section;
  }

  private bindControls(section: HTMLElement): void {
    const signal = this.destroySignal;

    // Arrows: a step + a fresh 4 s countdown
    section.querySelector('.new-games__nav')?.addEventListener('click', (event) => {
      const button = event.target instanceof Element ? event.target.closest<HTMLElement>('[data-direction]') : null;
      if (!button) return;

      if (button.dataset.direction === 'next') this.carousel?.next();
      if (button.dataset.direction === 'prev') this.carousel?.prev();
      this.autoplay.reset();
    });

    const viewport = section.querySelector<HTMLElement>('.new-games__viewport');

    if (viewport) {
      attachSwipe(
        viewport,
        {
          // press and hold → paused; released on the spot → the REMAINING time runs out
          onPress: () => this.pause('press'),
          onRelease: () => this.resume('press'),
          // a real swipe → a step and a NEW 4 s countdown
          onSwipe: (direction) => {
            if (direction === 'left') this.carousel?.next();
            else this.carousel?.prev();
            this.autoplay.reset();
            this.resume('press');
          },
        },
        signal,
      );
    }

    // No steps "in the background" while the tab is hidden
    document.addEventListener(
      'visibilitychange',
      () => (document.hidden ? this.pause('hidden-tab') : this.resume('hidden-tab')),
      { signal },
    );

    // Any open dialog (Game Details, Auth) freezes the slider behind it: when it closes,
    // focus returns to the card that opened it — that card must still be where it was.
    // `toggle` does not bubble, so it is caught in the capture phase on the document
    document.addEventListener(
      'toggle',
      (event) => {
        if (!(event.target instanceof HTMLDialogElement)) return;
        if ((event as ToggleEvent).newState === 'open') this.pause('dialog');
        else this.resume('dialog');
      },
      { capture: true, signal },
    );
  }

  private autoplayStep(): void {
    this.carousel?.next();
    this.autoplay.start(); // one-shot timer → start the next countdown
  }

  private startAutoplay(): void {
    if (document.hidden) this.pauseReasons.add('hidden-tab');
    this.autoplay.start();
    if (this.pauseReasons.size > 0) this.autoplay.pause();

    // Leaving the page (router destroys it) must stop the timer, or it would step a detached carousel
    this.destroySignal.addEventListener('abort', () => this.autoplay.stop());
  }

  private pause(reason: PauseReason): void {
    this.pauseReasons.add(reason);
    this.autoplay.pause();
  }

  private resume(reason: PauseReason): void {
    this.pauseReasons.delete(reason);
    if (this.pauseReasons.size === 0) this.autoplay.resume();
  }
}
