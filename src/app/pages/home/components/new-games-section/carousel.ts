import { MEDIA_QUERIES } from '@app/core/constants/breakpoints';
import { getSlotOffsets, getSlotPosition, wrapIndex } from '@shared/utils/carousel';

/**
 * Carousel logic over an existing track of N cards.
 *
 * Invariant: the DOM order of the cards IS the visual order (slot offsets −4 … +4, center in the middle).
 * A step moves exactly one card — the one that wraps around, and it is fully hidden (width 0) at that moment.
 * All the other cards stay in place and only change their `data-position` → CSS animates their size.
 * Keeping the DOM order = visual order also keeps the Tab order equal to what the user sees.
 */
export class Carousel {
  private readonly track: HTMLElement;
  private readonly total: number;
  private readonly offsets: number[];
  private readonly desktopMidQuery: MediaQueryList;
  private currentIndex: number;

  constructor(track: HTMLElement, startIndex: number, signal: AbortSignal) {
    this.track = track;
    this.total = track.children.length;
    this.offsets = getSlotOffsets(this.total);
    this.currentIndex = startIndex;

    // "far" cards (±2) are visible only from 1440px: 5 cards there, 3 below
    this.desktopMidQuery = globalThis.matchMedia(MEDIA_QUERIES.desktopMid);
    this.desktopMidQuery.addEventListener('change', () => this.updatePositions(), { signal });

    this.updatePositions();
  }

  /** Index (in the games list) of the card in the center */
  get current(): number {
    return this.currentIndex;
  }

  /** Cards move right → left: the right neighbour comes to the center */
  next(): void {
    const leftmost = this.track.firstElementChild;
    if (leftmost) this.track.append(leftmost); // hidden at −4 → wraps to +4

    this.currentIndex = wrapIndex(this.currentIndex + 1, this.total);
    this.updatePositions();
  }

  /** Cards move left → right: the left neighbour comes to the center */
  prev(): void {
    const rightmost = this.track.lastElementChild;
    if (rightmost) this.track.prepend(rightmost); // hidden at +4 → wraps to −4

    this.currentIndex = wrapIndex(this.currentIndex - 1, this.total);
    this.updatePositions();
  }

  private updatePositions(): void {
    const visibleDistance = this.desktopMidQuery.matches ? 2 : 1;

    for (const [index, card] of [...this.track.children].entries()) {
      if (!(card instanceof HTMLElement)) continue;

      const offset = this.offsets[index];
      card.dataset.position = getSlotPosition(offset);
      // A collapsed card must not be reachable by Tab or read by a screen reader
      card.inert = Math.abs(offset) > visibleDistance;
    }
  }
}
