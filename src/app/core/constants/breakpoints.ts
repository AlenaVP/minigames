export const BREAKPOINTS = {
  mobile: 375,
  toTablet: 425,
  tablet: 768,
  toDesktop: 1024,
  desktopMid: 1440,
  max: 1920,
} as const;

export const MEDIA_QUERIES = {
  tablet: `(min-width: ${BREAKPOINTS.toTablet}px)`,
  desktop: `(min-width: ${BREAKPOINTS.toDesktop}px)`,
  desktopMid: `(min-width: ${BREAKPOINTS.desktopMid}px)`,
} as const;
