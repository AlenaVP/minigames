// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { attachSwipe } from './swipe';

function pointer(type: string, target: EventTarget, init: PointerEventInit = {}): PointerEvent {
  const event = new PointerEvent(type, { bubbles: true, cancelable: true, pointerId: 1, pointerType: 'touch', ...init });
  target.dispatchEvent(event);
  return event;
}

describe('attachSwipe', () => {
  let area: HTMLElement;
  let controller: AbortController;
  const callbacks = { onPress: vi.fn(), onRelease: vi.fn(), onSwipe: vi.fn() };

  beforeEach(() => {
    vi.useFakeTimers();
    area = document.createElement('div');
    document.body.append(area);
    controller = new AbortController();
    attachSwipe(area, callbacks, controller.signal);
  });

  afterEach(() => {
    controller.abort();
    area.remove();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('reports a press, then a swipe to the left or right on release', () => {
    pointer('pointerdown', area, { clientX: 200, clientY: 50 });
    pointer('pointerup', document, { clientX: 100, clientY: 60 });
    pointer('pointerdown', area, { clientX: 100, clientY: 50 });
    pointer('pointerup', document, { clientX: 200, clientY: 40 });

    expect(callbacks.onPress).toHaveBeenCalledTimes(2);
    expect(callbacks.onSwipe.mock.calls).toEqual([['left'], ['right']]);
    expect(callbacks.onRelease).not.toHaveBeenCalled();
  });

  it('treats a short or mostly vertical move as a release, not a swipe', () => {
    pointer('pointerdown', area, { clientX: 100, clientY: 0 });
    pointer('pointerup', document, { clientX: 130, clientY: 0 });
    pointer('pointerdown', area, { clientX: 100, clientY: 0 });
    pointer('pointerup', document, { clientX: 160, clientY: 200 });

    expect(callbacks.onSwipe).not.toHaveBeenCalled();
    expect(callbacks.onRelease).toHaveBeenCalledTimes(2);
  });

  it('treats a gesture the browser took over (pointercancel) as a release', () => {
    pointer('pointerdown', area, { clientX: 200 });
    pointer('pointercancel', document, { clientX: 0 });

    expect(callbacks.onSwipe).not.toHaveBeenCalled();
    expect(callbacks.onRelease).toHaveBeenCalledOnce();
  });

  it('ignores the right mouse button and the pointer of another finger', () => {
    pointer('pointerdown', area, { pointerType: 'mouse', button: 2 });
    pointer('pointerdown', area, { clientX: 200 });
    pointer('pointerup', document, { pointerId: 2, clientX: 0 });

    expect(callbacks.onPress).toHaveBeenCalledOnce();
    expect(callbacks.onSwipe).not.toHaveBeenCalled();
  });

  it('swallows the click that ends a swipe, so the card under the finger does not open', () => {
    const onClick = vi.fn();
    area.addEventListener('click', onClick);

    pointer('pointerdown', area, { clientX: 200 });
    pointer('pointerup', document, { clientX: 50 });
    area.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onClick).not.toHaveBeenCalled();
  });

  it('lets a normal tap click through', () => {
    const onClick = vi.fn();
    area.addEventListener('click', onClick);

    pointer('pointerdown', area, { clientX: 200 });
    pointer('pointerup', document, { clientX: 200 });
    area.dispatchEvent(new MouseEvent('click', { bubbles: true }));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks image dragging and the touch context menu', () => {
    expect(area.dispatchEvent(new Event('dragstart', { cancelable: true }))).toBe(false);

    pointer('pointerdown', area);
    expect(area.dispatchEvent(new Event('contextmenu', { cancelable: true }))).toBe(false);
  });

  it('stops listening once the signal aborts', () => {
    controller.abort();

    pointer('pointerdown', area);

    expect(callbacks.onPress).not.toHaveBeenCalled();
  });
});
