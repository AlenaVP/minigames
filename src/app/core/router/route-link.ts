import { DEFAULT_ROUTE, toHref, type RouteId } from '../constants/routes';
import type { NavLink } from '../constants/nav-links';

/** Attributes for any in-app link: real href (semantics, Story 4) + data-route (SPA click). */
export function routeLinkAttributes(route: RouteId): string {
  return `href="${toHref(route)}" data-route="${route}"`;
}

/** Nav links additionally carry data-nav-page, so they can be marked as the current page. */
export function navLinkAttributes(link: NavLink): string {
  const navPage = link.page ? ` data-nav-page="${link.page}"` : '';
  return `${routeLinkAttributes(link.page ?? DEFAULT_ROUTE)}${navPage}`;
}

export function markActiveNavLinks(root: ParentNode, route: RouteId): void {
  for (const link of root.querySelectorAll<HTMLAnchorElement>('a[data-nav-page]')) {
    if (link.dataset.navPage === route) {
      link.setAttribute('aria-current', 'page');
    } else {
      link.removeAttribute('aria-current');
    }
  }
}
