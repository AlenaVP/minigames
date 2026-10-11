import { ComponentBase } from '@app/core/component.base';
import { PRIMARY_NAV_LINKS } from '@app/core/constants/nav-links';
import type { RouteId } from '@app/core/constants/routes';
import { markActiveNavLinks, navLinkAttributes, routeLinkAttributes } from '@app/core/router';
import type { AuthMode } from '@app/shared/types/auth';
import type { AppSession, SessionSource } from '@shared/types/session';
import { UserAvatar } from '@shared/ui/user-avatar';
import brandLogoUrl from '@assets/icons/brand-logo.svg';
import './burger-menu.scss';

interface BurgerMenuOptions {
  /** Which controls to show at the bottom: guest (Log In / Sign Up) or the signed-in user (profile, Log Out) */
  session: SessionSource;
  onAuthClick: (mode: AuthMode) => void;
  onLogout: () => void;
}

export class BurgerMenu extends ComponentBase {
  private options: BurgerMenuOptions;
  private isOpen = false;
  private readonly avatar = new UserAvatar({ variant: 'accent' });

  constructor(options: BurgerMenuOptions) {
    super();
    this.options = options;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    this.options.session.onChange(({ session }) => this.showSession(session), this.destroySignal);
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

        <div class="burger-menu__actions burger-menu__actions--guest">
          <button type="button" class="burger-menu__auth-btn burger-menu__auth-btn--outlined" data-auth="login">Log In</button>
          <button type="button" class="burger-menu__auth-btn burger-menu__auth-btn--filled" data-auth="signup">Sign Up</button>
        </div>

        <!-- The mockup's signed-in menu has only Log Out; RSS-QS-4-3-1 asks for the profile here too -->
        <div class="burger-menu__actions burger-menu__actions--user" hidden>
          <p class="burger-menu__profile">
            <span class="visually-hidden">Signed in as</span>
            <span class="burger-menu__user-name"></span>
          </p>
          <button type="button" class="burger-menu__auth-btn burger-menu__auth-btn--outlined burger-menu__auth-btn--logout">Log Out</button>
        </div>
      </div>
    `;

    const profile = dialog.querySelector<HTMLElement>('.burger-menu__profile');
    if (profile) this.mountChild(this.avatar, profile);

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
    document.body.style.overflow = 'hidden';
  }

  private showSession(session: AppSession | null): void {
    const menu = this.element;
    if (!menu) return;

    const guestActions = menu.querySelector<HTMLElement>('.burger-menu__actions--guest');
    const userActions = menu.querySelector<HTMLElement>('.burger-menu__actions--user');
    const nameLabel = menu.querySelector<HTMLElement>('.burger-menu__user-name');
    if (!guestActions || !userActions || !nameLabel) return;

    guestActions.hidden = session !== null;
    userActions.hidden = session === null;

    // textContent, never innerHTML: displayName comes from the identity provider and the editable localStorage record
    nameLabel.textContent = session?.displayName ?? '';
    nameLabel.title = session?.displayName ?? '';
    this.avatar.setProfile(session ? { name: session.displayName, photoUrl: session.avatarUrl } : null);
  }

  private bindEvents(dialog: HTMLElement): void {
    dialog.querySelector('.burger-menu__close')?.addEventListener('click', () => this.close());

    const authButtons = dialog.querySelectorAll<HTMLButtonElement>('.burger-menu__auth-btn[data-auth]');

    for (const button of authButtons) {
      button.addEventListener('click', () => {
        const mode = button.dataset.auth === 'signup' ? 'signup' : 'login';
        this.close();
        this.options.onAuthClick(mode);
      });
    }

    // Like every other action in the menu, Log Out closes it: the page underneath shows the guest header at once
    dialog.querySelector('.burger-menu__auth-btn--logout')?.addEventListener('click', () => {
      this.close();
      this.options.onLogout();
    });

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
