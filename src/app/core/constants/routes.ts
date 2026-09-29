export const ROUTES = {
  home: '/',
  library: '/library',
} as const;

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = 'home';

// Object.hasOwn, not `in`: `'toString' in ROUTES` is true because of the prototype chain
export function isRouteId(value: string | undefined): value is RouteId {
  return value !== undefined && Object.hasOwn(ROUTES, value);
}

// Vite base: '/minigames/' (GitHub Pages) or '/' (Netlify) → '/minigames/library' or '/library'
export function toHref(route: RouteId): string {
  return `${import.meta.env.BASE_URL}${ROUTES[route].slice(1)}`;
}
