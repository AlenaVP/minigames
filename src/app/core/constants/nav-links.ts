import type { RouteId } from './routes';

export interface NavLink {
  label: string;
  /** Page this link represents. `null` — the page doesn't exist in the mockup, link leads to Home. */
  page: RouteId | null;
}

export const PRIMARY_NAV_LINKS: readonly NavLink[] = [
  { label: 'Home', page: 'home' },
  { label: 'Library', page: 'library' },
  { label: 'Tournaments', page: null },
  { label: 'Community', page: null },
];

export const FOOTER_EXPLORE_LINKS: readonly NavLink[] = [
  { label: 'Home', page: 'home' },
  { label: 'Library', page: 'library' },
  { label: 'Categories', page: null },
  { label: 'Tournaments', page: null },
];

export const FOOTER_COMPANY_LINKS: readonly NavLink[] = [
  { label: 'About Us', page: null },
  { label: 'Contact', page: null },
  { label: 'Privacy Policy', page: null },
  { label: 'Terms of Service', page: null },
];
