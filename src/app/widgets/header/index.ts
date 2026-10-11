import { ComponentBase } from '@app/core/component.base';
import { PRIMARY_NAV_LINKS } from '@app/core/constants/nav-links';
import type { RouteId } from '@app/core/constants/routes';
import { markActiveNavLinks, navLinkAttributes, routeLinkAttributes } from '@app/core/router';
import type { AuthMode } from '@app/shared/types/auth';
import type { AppSession, SessionSource } from '@shared/types/session';
import { UserAvatar } from '@shared/ui/user-avatar';
import brandLogoUrl from '@assets/icons/brand-logo.svg';
import './header.scss';

interface HeaderOptions {
  /** Which controls to show: guest (Log In / Sign Up) or the signed-in user (name, avatar, Log Out) */
  session: SessionSource;
  onBurgerClick: () => void;
  onAuthClick: (mode: AuthMode) => void;
  onLogout: () => void;
}

/**
 * Guidebook "Navigation Bar":
 *   desktop — links + Log In + Sign Up  |  links + name + avatar + Log Out
 *   tablet  — Sign Up + burger          |  Log Out + burger
 *   mobile  — burger only (the profile and Log Out live in the burger menu)
 */
export class Header extends ComponentBase {
  private options: HeaderOptions;
  private readonly avatar = new UserAvatar();

  constructor(options: HeaderOptions) {
    super();
    this.options = options;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    // BehaviorSubject-style: paints the current state at once, then follows sign-in / logout / expiration / other tabs
    this.options.session.onChange(({ session }) => this.showSession(session), this.destroySignal);
  }

  setActiveRoute(route: RouteId): void {
    if (this.element) markActiveNavLinks(this.element, route);
  }

  protected render(): HTMLElement {
    const header = document.createElement('header');
    header.classList.add('header');

    header.innerHTML = `
  <div class="header__inner">
    <a ${routeLinkAttributes('home')} class="header__logo" aria-label="MiniGames home">
      <img src="${brandLogoUrl}" alt="" width="32" height="32" class="header__logo-icon" />
      <span class="header__logo-text">MiniGames</span>
    </a>

    <div class="header__right">
      <nav class="header__nav" aria-label="Primary">
        <ul class="header__nav-list">
          ${PRIMARY_NAV_LINKS.map(
            (link) => `
            <li>
              <a ${navLinkAttributes(link)} class="header__nav-link">${link.label}</a>
            </li>`,
          ).join('')}
        </ul>
      </nav>

      <div class="header__actions header__actions--guest">
        <button type="button" class="header__auth-btn header__auth-btn--outlined" data-auth="login">Log In</button>
        <button type="button" class="header__auth-btn header__auth-btn--filled" data-auth="signup">Sign Up</button>
      </div>

      <div class="header__actions header__actions--user" hidden>
        <p class="header__profile">
          <span class="visually-hidden">Signed in as</span>
          <span class="header__user-name"></span>
        </p>
        <button type="button" class="header__auth-btn header__auth-btn--outlined header__auth-btn--logout">Log Out</button>
      </div>

      <button type="button" class="header__burger" aria-label="Open menu">
        <span class="header__burger-line"></span>
        <span class="header__burger-line"></span>
        <span class="header__burger-line"></span>
      </button>
    </div>
  </div>
    `;

    const profile = header.querySelector<HTMLElement>('.header__profile');
    if (profile) this.mountChild(this.avatar, profile);

    this.bindEvents(header);

    return header;
  }

  private showSession(session: AppSession | null): void {
    const header = this.element;
    if (!header) return;

    const guestActions = header.querySelector<HTMLElement>('.header__actions--guest');
    const userActions = header.querySelector<HTMLElement>('.header__actions--user');
    const nameLabel = header.querySelector<HTMLElement>('.header__user-name');
    if (!guestActions || !userActions || !nameLabel) return;

    // Log Out is about to disappear under the keyboard user's focus — it must not fall to <body>
    const wasFocusOnUserActions = userActions.contains(document.activeElement);

    guestActions.hidden = session !== null;
    userActions.hidden = session === null;

    // textContent, never innerHTML: displayName comes from the identity provider and the editable localStorage record
    nameLabel.textContent = session?.displayName ?? '';
    // A long name is cut with "…" — the tooltip keeps the whole of it
    nameLabel.title = session?.displayName ?? '';
    this.avatar.setProfile(session ? { name: session.displayName, photoUrl: session.avatarUrl } : null);

    if (session === null && wasFocusOnUserActions) focusFirstVisible(guestActions.querySelectorAll('button'));
  }

  private bindEvents(header: HTMLElement): void {
    header
      .querySelector<HTMLButtonElement>('.header__burger')
      ?.addEventListener('click', () => this.options.onBurgerClick());

    const authButtons = header.querySelectorAll<HTMLButtonElement>('.header__auth-btn[data-auth]');

    for (const button of authButtons) {
      button.addEventListener('click', () => {
        const mode = button.dataset.auth === 'signup' ? 'signup' : 'login';
        this.options.onAuthClick(mode);
      });
    }

    header
      .querySelector<HTMLButtonElement>('.header__auth-btn--logout')
      ?.addEventListener('click', () => this.options.onLogout());
  }
}

/** Log In is hidden on tablets (CSS), so the focus goes to the first button that is actually on screen */
function focusFirstVisible(elements: Iterable<HTMLElement>): void {
  for (const element of elements) {
    if (element.checkVisibility()) {
      element.focus();
      return;
    }
  }
}
