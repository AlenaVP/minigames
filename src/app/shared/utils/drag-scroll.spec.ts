// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { enableDragScroll } from './drag-scroll';

function pointer(type: string, init: Partial<PointerEventInit> = {}): PointerEvent {
  return new PointerEvent(type, { bubbles: true, pointerId: 1, pointerType: 'mouse', button: 0, ...init });
}

describe('enableDragScroll', () => {
  let strip: HTMLElement;
  let chip: HTMLButtonElement;

  beforeEach(() => {
    strip = document.createElement('div');
    chip = document.createElement('button');
    strip.append(chip);
    document.body.replaceChildren(strip);
    strip.scrollLeft = 100;
    // happy-dom has no layout, so pointer capture is a no-op stub here
    strip.setPointerCapture = vi.fn();
  });

  it('scrolls the strip by the distance the mouse was dragged', () => {
    enableDragScroll(strip);

    strip.dispatchEvent(pointer('pointerdown', { clientX: 200 }));
    strip.dispatchEvent(pointer('pointermove', { clientX: 150 }));

    expect(strip.scrollLeft).toBe(150);
    expect(strip.classList.contains('is-dragging')).toBe(true);
    expect(strip.setPointerCapture).toHaveBeenCalledWith(1);

    strip.dispatchEvent(pointer('pointerup', { clientX: 150 }));
    expect(strip.classList.contains('is-dragging')).toBe(false);
  });

  it('treats a move under the threshold as a click, not a drag', () => {
    const onClick = vi.fn();
    chip.addEventListener('click', onClick);
    enableDragScroll(strip);

    strip.dispatchEvent(pointer('pointerdown', { clientX: 200 }));
    strip.dispatchEvent(pointer('pointermove', { clientX: 197 }));
    strip.dispatchEvent(pointer('pointerup', { clientX: 197 }));
    chip.click();

    expect(strip.scrollLeft).toBe(100);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('swallows the click that the browser fires right after a drag, but only that one', () => {
    const onClick = vi.fn();
    chip.addEventListener('click', onClick);
    enableDragScroll(strip);

    strip.dispatchEvent(pointer('pointerdown', { clientX: 200 }));
    strip.dispatchEvent(pointer('pointermove', { clientX: 120 }));
    strip.dispatchEvent(pointer('pointerup', { clientX: 120 }));
    chip.click();
    expect(onClick).not.toHaveBeenCalled();

    chip.click();
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('ignores touch and pen (they scroll natively) and non-primary mouse buttons', () => {
    enableDragScroll(strip);

    strip.dispatchEvent(pointer('pointerdown', { clientX: 200, pointerType: 'touch' }));
    strip.dispatchEvent(pointer('pointermove', { clientX: 100, pointerType: 'touch' }));
    strip.dispatchEvent(pointer('pointerdown', { clientX: 200, button: 2 }));
    strip.dispatchEvent(pointer('pointermove', { clientX: 100 }));

    expect(strip.scrollLeft).toBe(100);
  });

  it('stops tracking when the pointer is cancelled', () => {
    enableDragScroll(strip);

    strip.dispatchEvent(pointer('pointerdown', { clientX: 200 }));
    strip.dispatchEvent(pointer('pointercancel'));
    strip.dispatchEvent(pointer('pointermove', { clientX: 100 }));

    expect(strip.scrollLeft).toBe(100);
  });

  it('removes its listeners when the owner is destroyed', () => {
    const destroy = new AbortController();
    enableDragScroll(strip, destroy.signal);
    destroy.abort();

    strip.dispatchEvent(pointer('pointerdown', { clientX: 200 }));
    strip.dispatchEvent(pointer('pointermove', { clientX: 100 }));

    expect(strip.scrollLeft).toBe(100);
  });
});
