import type { ComponentBase } from '../component.base';
import { DEFAULT_ROUTE, isRouteId, type RouteId } from '../constants/routes';

type PageFactory = () => ComponentBase;
type RouteListener = (route: RouteId) => void;

/**
 * Story 2: minimal in-app page switch (no URL changes).
 * Story 4: navigate() gets history.pushState + popstate; the public API stays the same.
 */
export class Router {
  private readonly outlet: HTMLElement;
  private readonly pages: Record<RouteId, PageFactory>;
  private readonly listeners = new Set<RouteListener>();
  private currentRoute: RouteId | null = null;
  private currentPage: ComponentBase | null = null;

  constructor(outlet: HTMLElement, pages: Record<RouteId, PageFactory>) {
    this.outlet = outlet;
    this.pages = pages;
  }

  start(initialRoute: RouteId = DEFAULT_ROUTE): void {
    document.addEventListener('click', this.handleDocumentClick);
    this.navigate(initialRoute);
  }

  navigate(route: RouteId): void {
    if (route !== this.currentRoute) {
      this.currentPage?.destroy();
      this.currentPage = this.pages[route]();
      this.currentPage.mount(this.outlet);
      this.currentRoute = route;

      for (const listener of this.listeners) listener(route);
    }

    window.scrollTo({ top: 0 });
  }

  /** Like a BehaviorSubject: a new subscriber immediately gets the current route. */
  onChange(listener: RouteListener): () => void {
    this.listeners.add(listener);
    if (this.currentRoute) listener(this.currentRoute);

    return () => {
      this.listeners.delete(listener);
    };
  }

  private handleDocumentClick = (event: MouseEvent): void => {
    if (event.defaultPrevented || event.button !== 0) return;
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    if (!(event.target instanceof Element)) return;

    const route = event.target.closest<HTMLAnchorElement>('a[data-route]')?.dataset.route;
    if (!isRouteId(route)) return;

    event.preventDefault();
    this.navigate(route);
  };
}
