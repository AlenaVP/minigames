import { ComponentBase } from '@app/core/component.base';
import { routeLinkAttributes } from '@app/core/router';
import { escapeHtml } from '@shared/utils/escape-html';
import './not-found.page.scss';

/**
 * 3-4-2: shown for any path no page matches (/unknown, /page/abc…), inside the usual Header and Footer.
 * The URL stays as typed — the user can see and fix it; the button is an SPA link to Home.
 */
export class NotFoundPage extends ComponentBase {
  protected render(): HTMLElement {
    const base = import.meta.env.BASE_URL;
    const path = location.pathname.startsWith(base) ? `/${location.pathname.slice(base.length)}` : location.pathname;

    const page = document.createElement('section');
    page.classList.add('not-found');
    page.setAttribute('aria-labelledby', 'not-found-title');

    page.innerHTML = `
      <div class="not-found__card">
        <p class="not-found__code" aria-hidden="true">404</p>
        <h1 id="not-found-title" class="not-found__title">Page not found</h1>
        <p class="not-found__message">
          The page <code class="not-found__path">${escapeHtml(decodeSafely(path))}</code> doesn't exist or has been moved.
        </p>
        <a ${routeLinkAttributes('home')} class="not-found__action">Return to Home Page</a>
      </div>
    `;

    return page;
  }
}

/** "/caf%C3%A9" → "/café" for reading; a broken escape ("/%E0") must not throw — the raw path is shown instead */
function decodeSafely(path: string): string {
  try {
    return decodeURIComponent(path);
  } catch {
    return path;
  }
}
