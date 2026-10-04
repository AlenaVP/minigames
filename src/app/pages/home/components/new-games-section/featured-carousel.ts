import { ComponentBase } from '@app/core/component.base';
import type { GameSummary } from '@shared/types/game';
import { getSlotOffsets, getSlotPosition, wrapIndex } from '@shared/utils/carousel';
import { PausableTimer } from '@shared/utils/pausable-timer';
import { GameCard } from '@widgets/game-card';
import { Carousel } from './carousel';
import { attachSwipe } from './swipe';

interface FeaturedCarouselOptions {
  games: readonly GameSummary[];
  onGameDetails: (slug: string) => void;
}

// The first featured game (the API sorts them by rating) starts in the center; its neighbours wrap around
const START_INDEX = 0;
const AUTOPLAY_INTERVAL_MS = 4000;
/** With fewer cards there is nothing to scroll through */
const MIN_GAMES_TO_SCROLL = 2;

/**
 * Several things can pause the autoplay at once (e.g. a hold while the tab gets hidden):
 * it resumes only when ALL of them are gone.
 */
type PauseReason = 'press' | 'hidden-tab' | 'dialog';

/**
 * The loaded slider: viewport + cards + swipe + autoplay.
 * Lives only while there is data — destroyed together with its timer when the area shows skeleton/error.
 */
export class FeaturedCarousel extends ComponentBase {
  private readonly options: FeaturedCarouselOptions;
  private carousel: Carousel | null = null;
  private readonly pauseReasons = new Set<PauseReason>();
  private readonly autoplay: PausableTimer;

  constructor(options: FeaturedCarouselOptions) {
    super();
    this.options = options;
    // 2-3-1: one step right → left every 4 s
    this.autoplay = new PausableTimer(() => this.autoplayStep(), AUTOPLAY_INTERVAL_MS);
  }

  get canScroll(): boolean {
    return this.options.games.length >= MIN_GAMES_TO_SCROLL;
  }

  /** Arrow click: a step + a fresh 4 s countdown */
  next(): void {
    this.carousel?.next();
    this.autoplay.reset();
  }

  prev(): void {
    this.carousel?.prev();
    this.autoplay.reset();
  }

  protected render(): HTMLElement {
    const { games, onGameDetails } = this.options;

    const viewport = document.createElement('div');
    viewport.classList.add('new-games__viewport');
    viewport.innerHTML = '<ul class="new-games__track" aria-live="off"></ul>';

    const track = viewport.querySelector<HTMLUListElement>('.new-games__track');
    if (!track) return viewport;

    // All cards, already in the visual order: offsets −4 … +4 around START_INDEX
    for (const offset of getSlotOffsets(games.length)) {
      const gameIndex = wrapIndex(START_INDEX + offset, games.length);

      this.mountChild(new GameCard({ game: games[gameIndex], onClick: onGameDetails, className: 'new-games__card' }), track);

      const slide = track.lastElementChild;
      slide?.setAttribute('aria-roledescription', 'slide');
      slide?.setAttribute('aria-label', `${gameIndex + 1} of ${games.length}`);
    }

    this.carousel = new Carousel(track, START_INDEX, this.destroySignal);

    if (this.canScroll) {
      this.bindInteractions(viewport);
      this.startAutoplay();
    }

    return viewport;
  }

  private bindInteractions(viewport: HTMLElement): void {
    const signal = this.destroySignal;

    attachSwipe(
      viewport,
      {
        // press and hold → paused; released on the spot → the REMAINING time runs out
        onPress: () => this.pause('press'),
        onRelease: () => this.resume('press'),
        // a real swipe → a step and a NEW 4 s countdown
        onSwipe: (direction) => {
          if (direction === 'left') this.next();
          else this.prev();
          this.resume('press');
        },
      },
      signal,
    );

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
    // Data may arrive while a dialog is already open (e.g. a slow network)
    if (document.querySelector('dialog:modal')) this.pauseReasons.add('dialog');

    this.autoplay.start();
    if (this.pauseReasons.size > 0) this.autoplay.pause();

    // Destroyed (new state of the area, or the router left the page) → the timer must not step a detached track
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

/** Same viewport/track/slot sizes as the real slider → the cards appear exactly where the placeholders were */
export function renderFeaturedCarouselSkeleton(slotCount: number): HTMLElement {
  const viewport = document.createElement('div');
  viewport.classList.add('new-games__viewport');
  viewport.innerHTML = `
    <ul class="new-games__track">
      ${getSlotOffsets(slotCount)
        .map((offset) => `<li class="new-games__card skeleton" data-position="${getSlotPosition(offset)}"></li>`)
        .join('')}
    </ul>
  `;
  return viewport;
}
