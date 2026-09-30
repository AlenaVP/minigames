export type SwipeDirection = 'left' | 'right';

interface SwipeCallbacks {
  /** Finger/mouse went down on the area (press-and-hold starts) */
  onPress: () => void;
  /** Released without a swipe (or the browser took the gesture over, e.g. vertical scroll) */
  onRelease: () => void;
  onSwipe: (direction: SwipeDirection) => void;
}

const SWIPE_MIN_DISTANCE_PX = 40;
// Held this long and released on the spot = "pause", not "open the card"
const LONG_PRESS_MS = 500;

/**
 * Swipe variant a): the step happens on release, the track does not follow the finger.
 * The area needs `touch-action: pan-y` in CSS: vertical swipes still scroll the page,
 * horizontal ones come to us as pointer events.
 */
export function attachSwipe(area: HTMLElement, callbacks: SwipeCallbacks, signal: AbortSignal): void {
  let pointerId: number | null = null;
  let pointerType = '';
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let suppressClick = false;

  area.addEventListener(
    'pointerdown',
    (event) => {
      if (pointerId !== null) return; // a second finger
      if (event.pointerType === 'mouse' && event.button !== 0) return;

      pointerId = event.pointerId;
      pointerType = event.pointerType;
      startX = event.clientX;
      startY = event.clientY;
      startTime = performance.now();
      suppressClick = false;
      callbacks.onPress();
    },
    { signal },
  );

  const finish = (event: PointerEvent, isCancelled: boolean): void => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;

    const deltaX = event.clientX - startX;
    const deltaY = event.clientY - startY;
    const isSwipe = !isCancelled && Math.abs(deltaX) >= SWIPE_MIN_DISTANCE_PX && Math.abs(deltaX) > Math.abs(deltaY);
    const isLongPress = performance.now() - startTime >= LONG_PRESS_MS;

    // The browser still fires `click` after pointerup — it must not open the dialog after a swipe or a hold.
    // Reset right after the click would have been dispatched, so a later keyboard "click" is not eaten.
    suppressClick = isSwipe || isLongPress;
    setTimeout(() => (suppressClick = false), 0);

    if (isSwipe) {
      callbacks.onSwipe(deltaX < 0 ? 'left' : 'right');
    } else {
      callbacks.onRelease();
    }
  };

  // On the document, not on the area: the release must be seen even when it happens outside the slider
  document.addEventListener('pointerup', (event) => finish(event, false), { signal });
  document.addEventListener('pointercancel', (event) => finish(event, true), { signal });

  area.addEventListener(
    'click',
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation(); // capture phase → the card's own handler never runs
    },
    { capture: true, signal },
  );

  // Mouse: dragging an <img> would start the browser's native drag & drop instead of our swipe
  area.addEventListener('dragstart', (event) => event.preventDefault(), { signal });

  // Touch: a long press would open the image context menu ("Save image…") on top of the slider
  area.addEventListener(
    'contextmenu',
    (event) => {
      if (pointerType === 'touch') event.preventDefault();
    },
    { signal },
  );
}
