export const ROUTES = {
  home: '/',
  library: '/library',
} as const;

export type RouteId = keyof typeof ROUTES;

export const DEFAULT_ROUTE: RouteId = 'home';

export function isRouteId(value: string | undefined): value is RouteId {
  return value !== undefined && Object.hasOwn(ROUTES, value);
}

export function toHref(route: RouteId): string {
  return `${import.meta.env.BASE_URL}${ROUTES[route].slice(1)}`;
}
