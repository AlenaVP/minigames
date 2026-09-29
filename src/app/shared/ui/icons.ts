// Inline SVG icons: no font metrics (always centered) and `currentColor` → the icon takes the button's color.
// Material Symbols paths, 24×24 viewBox.

function icon(path: string, size: number): string {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="${path}" fill="currentColor" /></svg>`;
}

const CLOSE_PATH = 'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z';

export const closeIcon = (size = 24): string => icon(CLOSE_PATH, size);

// Material "favorite_border": outline heart; its color (default / liked) comes from `color` of the button
const HEART_OUTLINE_PATH =
  'M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z';

export const heartOutlineIcon = (size = 24): string => icon(HEART_OUTLINE_PATH, size);
