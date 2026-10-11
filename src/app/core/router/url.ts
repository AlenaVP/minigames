import { type PageRouteId, ROUTES, type RouteId } from '../constants/routes';

/** null removes the key, undefined leaves it as it is */
export type QueryPatch = Readonly<Record<string, string | null | undefined>>;

export interface ParsedLocation {
  route: RouteId;
  query: URLSearchParams;
}

/**
 * Canonical order of known keys, so equal states always give an equal URL:
 * /library?category=puzzle&sort=rating-desc&page=2&game=tiny-glade
 */
const QUERY_KEY_ORDER = ['category', 'sort', 'page', 'game', 'auth'];

/** "/minigames/library/" with base "/minigames/" → "library"; anything unknown → 'not-found' */
export function parseLocation(pathname: string, search: string, base: string): ParsedLocation {
  const relative = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/+/, '');
  const path = relative.replace(/\/+$/, '');

  const route = (Object.keys(ROUTES) as PageRouteId[]).find((id) => (ROUTES[id] as readonly string[]).includes(path));

  return { route: route ?? 'not-found', query: new URLSearchParams(search) };
}

export function mergeQuery(query: URLSearchParams, patch: QueryPatch): URLSearchParams {
  const next = new URLSearchParams(query);

  for (const [key, value] of Object.entries(patch)) {
    if (value === null) next.delete(key);
    else if (value !== undefined) next.set(key, value);
  }

  return sortQuery(next);
}

function queryKeyRank(key: string): number {
  const index = QUERY_KEY_ORDER.indexOf(key);
  return index === -1 ? QUERY_KEY_ORDER.length : index;
}

export function sortQuery(query: URLSearchParams): URLSearchParams {
  return new URLSearchParams([...query.entries()].toSorted(([a], [b]) => queryKeyRank(a) - queryKeyRank(b)));
}

/** pathname + search for history.pushState, inside the deploy base */
export function buildUrl(route: PageRouteId, query: URLSearchParams, base: string): string {
  const search = query.toString();
  return `${base}${ROUTES[route][0]}${search ? `?${search}` : ''}`;
}
