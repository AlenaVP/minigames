import type { ComponentBase } from '../component.base';
import { DEFAULT_ROUTE, isPageRouteId, type PageRouteId, type RouteId } from '../constants/routes';
import { buildUrl, mergeQuery, parseLocation, type QueryPatch, sortQuery } from './url';

/** What the URL currently means — the app's single source of truth for navigable state */
export interface RouteSnapshot {
  readonly route: RouteId;
  readonly query: URLSearchParams;
}

/** A page that wants query changes WITHOUT being re-created (Angular: route reuse + queryParamMap) */
export interface QueryAwarePage {
  onQueryChange(query: URLSearchParams): void;
}

export type PageFactory = (snapshot: RouteSnapshot) => ComponentBase;
type RouteListener = (snapshot: RouteSnapshot) => void;

export interface NavigateOptions {
  /** Corrections that are not user actions (canonical URL, invalid params, tab switch) */
  replace?: boolean;
  /** The new entry was created by opening a dialog: closing it may simply go back */
  dialog?: boolean;
}

interface HistoryState {
  dialog?: boolean;
}

const BASE = import.meta.env.BASE_URL;

function isQueryAwarePage(page: ComponentBase): page is ComponentBase & QueryAwarePage {
  return 'onQueryChange' in page && typeof page.onQueryChange === 'function';
}

/**
 * History API router (no libraries):
 *
 *   user action → navigate()/updateQuery() → pushState → apply()  ┐
 *   Back / Forward → popstate ───────────────────────→ apply()  ├→ page (created or told about the query)
 *   deep link → start() ─────────────────────────────→ apply()  ┘   └→ listeners (header, dialogs)
 *
 * The UI never changes navigable state by itself: it asks the router, and reacts to what the router emits.
 */
export class Router {
  private readonly outlet: HTMLElement;
  private readonly pages: Partial<Record<RouteId, PageFactory>>;
  private readonly listeners = new Set<RouteListener>();
  private current: RouteSnapshot | null = null;
  private currentPage: ComponentBase | null = null;

  constructor(outlet: HTMLElement, pages: Partial<Record<RouteId, PageFactory>>) {
    this.outlet = outlet;
    this.pages = pages;
  }

  get snapshot(): RouteSnapshot | null {
    return this.current;
  }

  /** The current history entry was pushed by opening a dialog (see NavigateOptions.dialog) */
  get isDialogEntry(): boolean {
    const state: unknown = history.state;
    return typeof state === 'object' && state !== null && (state as HistoryState).dialog === true;
  }

  start(): void {
    // Scroll is handled per navigation below; the browser's own restoration fights async content
    history.scrollRestoration = 'manual';
    document.addEventListener('click', this.handleDocumentClick);
    globalThis.addEventListener('popstate', () => this.applyLocation());
    this.applyLocation();
  }

  /** To another page (or the same page with a fresh query) */
  navigate(route: PageRouteId, query: QueryPatch = {}, options: NavigateOptions = {}): void {
    this.commit(route, mergeQuery(new URLSearchParams(), query), options);
  }

  /** Same page, some query keys changed: Library state, dialogs */
  updateQuery(patch: QueryPatch, options: NavigateOptions = {}): void {
    const route = this.current?.route;
    // Query changes on the 404 view stay on its URL path: there is no page route to rebuild it from
    const pageRoute = route && isPageRouteId(route) ? route : null;
    const query = mergeQuery(this.current?.query ?? new URLSearchParams(), patch);

    if (pageRoute) {
      this.commit(pageRoute, query, options);
    } else {
      this.commitUrl(`${location.pathname}${query.size > 0 ? `?${query}` : ''}`, options);
    }
  }

  back(): void {
    history.back();
  }

  /** Like a BehaviorSubject: a new subscriber immediately gets the current snapshot */
  onChange(listener: RouteListener): () => void {
    this.listeners.add(listener);
    if (this.current) listener(this.current);
    return () => this.listeners.delete(listener);
  }

  private commit(route: PageRouteId, query: URLSearchParams, options: NavigateOptions): void {
    this.commitUrl(buildUrl(route, sortQuery(query), BASE), options);
  }

  private commitUrl(url: string, { replace = false, dialog }: NavigateOptions): void {
    // The same URL again (a click on the active link, an already-canonical state) → no new history entry
    if (url === `${location.pathname}${location.search}`) return;

    // replace keeps the entry's dialog flag unless told otherwise (e.g. switching Login ↔ Register tabs)
    const state: HistoryState = { dialog: dialog ?? (replace ? this.isDialogEntry : false) };

    if (replace) history.replaceState(state, '', url);
    else history.pushState(state, '', url);

    this.applyLocation();
  }

  private applyLocation(): void {
    const parsed = parseLocation(location.pathname, location.search, BASE);

    // Until a 404 page is registered, unknown paths fall back to Home
    if (parsed.route === 'not-found' && !this.pages['not-found']) {
      history.replaceState(history.state, '', buildUrl(DEFAULT_ROUTE, parsed.query, BASE));
      this.applyLocation();
      return;
    }

    const snapshot: RouteSnapshot = { route: parsed.route, query: sortQuery(parsed.query) };
    const isNewPage = snapshot.route !== this.current?.route;
    this.current = snapshot;

    if (isNewPage) {
      this.currentPage?.destroy();
      this.currentPage = this.pages[snapshot.route]?.(snapshot) ?? null;
      this.currentPage?.mount(this.outlet);
      window.scrollTo({ top: 0 });
    } else if (this.currentPage && isQueryAwarePage(this.currentPage)) {
      this.currentPage.onQueryChange(new URLSearchParams(snapshot.query));
    }

    for (const listener of this.listeners) listener(snapshot);
  }

  /** <a href data-route> → SPA navigation (routerLink); Ctrl/Cmd/Shift-click keeps the browser's behaviour */
  private handleDocumentClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;

    const route = event.target.closest<HTMLAnchorElement>('a[data-route]')?.dataset.route;
    if (!isPageRouteId(route)) return;

    event.preventDefault();
    this.navigate(route);
  };
}
