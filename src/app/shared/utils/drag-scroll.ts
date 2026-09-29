const DRAG_THRESHOLD_PX = 5;

/**
 * Mouse drag → horizontal scroll. Touch and pen already scroll natively, so they are ignored.
 * After a real drag the browser still fires `click`; it is swallowed so a chip is not selected by accident.
 */
export function enableDragScroll(element: HTMLElement, signal?: AbortSignal): void {
  let pointerId: number | null = null;
  let startX = 0;
  let startScrollLeft = 0;
  let isDragged = false;

  element.addEventListener(
    'pointerdown',
    (event) => {
      if (event.pointerType !== 'mouse' || event.button !== 0) return;

      pointerId = event.pointerId;
      startX = event.clientX;
      startScrollLeft = element.scrollLeft;
      isDragged = false;
    },
    { signal },
  );

  element.addEventListener(
    'pointermove',
    (event) => {
      if (event.pointerId !== pointerId) return;

      const deltaX = event.clientX - startX;
      if (!isDragged && Math.abs(deltaX) < DRAG_THRESHOLD_PX) return;

      if (!isDragged) {
        isDragged = true;
        element.setPointerCapture(event.pointerId); // keep dragging even if the cursor leaves the row
        element.classList.add('is-dragging');
      }

      element.scrollLeft = startScrollLeft - deltaX;
    },
    { signal },
  );

  const endDrag = (event: PointerEvent): void => {
    if (event.pointerId !== pointerId) return;
    pointerId = null;
    element.classList.remove('is-dragging');
  };

  element.addEventListener('pointerup', endDrag, { signal });
  element.addEventListener('pointercancel', endDrag, { signal });

  element.addEventListener(
    'click',
    (event) => {
      if (!isDragged) return;
      isDragged = false;
      event.preventDefault(); // for a <label>: no radio gets checked
      event.stopPropagation();
    },
    { capture: true, signal },
  );
}
