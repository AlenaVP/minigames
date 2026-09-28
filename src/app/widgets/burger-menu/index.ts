import { ComponentBase } from '@app/core/component.base';
import { PRIMARY_NAV_LINKS } from '@app/core/constants/nav-links';
import type { RouteId } from '@app/core/constants/routes';
import { markActiveNavLinks, navLinkAttributes, routeLinkAttributes } from '@app/core/router';
import type { AuthMode } from '@app/shared/types/auth';
import brandLogoUrl from '@assets/icons/brand-logo.svg';
import './burger-menu.scss';

interface BurgerMenuOptions {
  onAuthClick: (mode: AuthMode) => void;
}

export class BurgerMenu extends ComponentBase {
  private options: BurgerMenuOptions;
  private isOpen = false;

  constructor(options: BurgerMenuOptions) {
    super();
    this.options = options;
  }

  setActiveRoute(route: RouteId): void {
    if (this.element) markActiveNavLinks(this.element, route);
  }

  protected render(): HTMLElement {
    const dialog = document.createElement('div');
    dialog.classList.add('burger-menu');
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    dialog.setAttribute('aria-label', 'Navigation menu');
    dialog.hidden = true;

    dialog.innerHTML = `
      <div class="burger-menu__inner">
        <div class="burger-menu__top">
          <a ${routeLinkAttributes('home')} class="burger-menu__logo" aria-label="MiniGames home">
            <img src="${brandLogoUrl}" alt="" width="32" height="32" class="burger-menu__logo-icon" />
            <span class="burger-menu__logo-text">MiniGames</span>
          </a>
          <button type="button" class="burger-menu__close" aria-label="Close menu">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav class="burger-menu__nav" aria-label="Primary">
          <ul class="burger-menu__nav-list">
            ${PRIMARY_NAV_LINKS.map(
              (link) => `
              <li>
                <a ${navLinkAttributes(link)} class="burger-menu__nav-link">${link.label}</a>
              </li>`,
            ).join('')}
          </ul>
        </nav>

        <div class="burger-menu__actions">
          <button type="button" class="burger-menu__auth-btn burger-menu__auth-btn--outlined" data-auth="login">Log In</button>
          <button type="button" class="burger-menu__auth-btn burger-menu__auth-btn--filled" data-auth="signup">Sign Up</button>
        </div>
      </div>
    `;

    this.bindEvents(dialog);
    return dialog;
  }

  close(): void {
    if (!this.element || !this.isOpen) return;

    this.isOpen = false;
    this.element.classList.remove('burger-menu--open');
    document.removeEventListener('keydown', this.onKeydown);
    document.body.style.overflow = '';

    const onTransitionEnd = (): void => {
      if (this.element) this.element.hidden = true;
      this.element?.removeEventListener('transitionend', onTransitionEnd);
    };
    this.element.addEventListener('transitionend', onTransitionEnd);
  }

  open(): void {
    if (!this.element) return;

    this.isOpen = true;
    this.element.hidden = false;

    void this.element.offsetWidth;

    this.element.classList.add('burger-menu--open');
    document.addEventListener('keydown', this.onKeydown);
    document.body.style.overflow = 'hidden'; // disable background scrolling under the menu
  }

  private bindEvents(dialog: HTMLElement): void {
    dialog.querySelector('.burger-menu__close')?.addEventListener('click', () => this.close());

    const authButtons = dialog.querySelectorAll<HTMLButtonElement>('.burger-menu__auth-btn');

    for (const button of authButtons) {
      button.addEventListener('click', () => {
        const mode = button.dataset.auth === 'signup' ? 'signup' : 'login';
        this.close();
        this.options.onAuthClick(mode);
      });
    }

    // Any link inside the menu (nav links AND the logo) closes it.
    // Fires before the Router's document listener, because the menu is lower in the bubbling path.
    dialog.addEventListener('click', (event) => {
      if (event.target instanceof Element && event.target.closest('a')) this.close();
    });
  }

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };
}
