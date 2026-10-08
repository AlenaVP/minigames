export type SwipeDirection = 'left' | 'right';

interface SwipeCallbacks {
  /** Finger/mouse went down on the area (press-and-hold starts) */
  onPress: () => void;
  /** Released without a swipe (or the browser took the gesture over, e.g. vertical scroll) */
  onRelease: () => void;
  onSwipe: (direction: SwipeDirection) => void;
}

const SWIPE_MIN_DISTANCE_PX = 40;
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
      if (pointerId !== null) return;
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

    suppressClick = isSwipe || isLongPress;
    setTimeout(() => (suppressClick = false), 0);

    if (isSwipe) {
      callbacks.onSwipe(deltaX < 0 ? 'left' : 'right');
    } else {
      callbacks.onRelease();
    }
  };

  document.addEventListener('pointerup', (event) => finish(event, false), { signal });
  document.addEventListener('pointercancel', (event) => finish(event, true), { signal });

  area.addEventListener(
    'click',
    (event) => {
      if (!suppressClick) return;
      event.preventDefault();
      event.stopPropagation();
    },
    { capture: true, signal },
  );

  area.addEventListener('dragstart', (event) => event.preventDefault(), { signal });

  area.addEventListener(
    'contextmenu',
    (event) => {
      if (pointerType === 'touch') event.preventDefault();
    },
    { signal },
  );
}
