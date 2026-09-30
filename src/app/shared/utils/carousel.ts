/** Circular index: wrapIndex(-1, 9) → 8, wrapIndex(9, 9) → 0 */
export function wrapIndex(index: number, total: number): number {
  return ((index % total) + total) % total;
}

/**
 * Offsets of all slots from the center, left to right.
 * 9 cards → [-4 … 4], 8 cards → [-4 … 3]: the center has as many cards on the left as on the right.
 */
export function getSlotOffsets(total: number): number[] {
  const half = Math.floor(total / 2);
  return Array.from({ length: total }, (_, index) => index - half);
}

export type SlotPosition = 'center' | 'near' | 'far' | 'hidden';

/** Distance from the center → size class: 0 center, 1 near, 2 far, 3+ hidden */
export function getSlotPosition(offset: number): SlotPosition {
  const distance = Math.abs(offset);
  if (distance === 0) return 'center';
  if (distance === 1) return 'near';
  if (distance === 2) return 'far';
  return 'hidden';
}
