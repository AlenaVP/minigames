/**
 * Page numbers to show: a window of `maxVisible` pages that keeps the current page
 * as close to the middle as possible and never goes past the first/last page.
 *
 * getVisiblePages(1, 4, 3) → [1, 2, 3]
 * getVisiblePages(3, 4, 3) → [2, 3, 4]
 * getVisiblePages(6, 10, 4) → [5, 6, 7, 8]
 */
export function getVisiblePages(currentPage: number, totalPages: number, maxVisible: number): number[] {
  if (totalPages < 1 || maxVisible < 1) return [];

  const count = Math.min(maxVisible, totalPages);
  const idealStart = currentPage - Math.floor((count - 1) / 2);
  const start = Math.min(Math.max(idealStart, 1), totalPages - count + 1);

  return Array.from({ length: count }, (_, index) => start + index);
}
