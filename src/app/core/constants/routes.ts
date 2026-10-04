/** Pages with a URL of their own. The first path is the canonical one (used in links). */
export const ROUTES = {
  home: ['', 'home'],
  library: ['library'],
} as const;

export type PageRouteId = keyof typeof ROUTES;

/** 'not-found' has no path of its own: it is whatever no page matches */
export type RouteId = PageRouteId | 'not-found';

export const DEFAULT_ROUTE: PageRouteId = 'home';

export function isPageRouteId(value: string | undefined): value is PageRouteId {
  return value !== undefined && Object.hasOwn(ROUTES, value);
}

/** Respects the deploy base: "/" on Netlify, "/minigames/" on GitHub Pages */
export function toHref(route: PageRouteId): string {
  return `${import.meta.env.BASE_URL}${ROUTES[route][0]}`;
}
