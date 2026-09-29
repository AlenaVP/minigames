// Inline SVG icons: no font metrics (always centered) and `currentColor` → the icon takes the button's color.
// Material Symbols paths, 24×24 viewBox.

function icon(path: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}" fill="currentColor" /></svg>`;
}

const CLOSE_PATH = 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

export const closeIcon = (size = 24): string => icon(CLOSE_PATH, size);
