export const BREAKPOINTS = {
  mobile: 375,
  tablet: 768,
  desktop: 1920,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS; // type Breakpoint = 'mobile' | 'tablet' | 'desktop'
