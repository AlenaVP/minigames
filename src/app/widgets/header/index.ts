import { ComponentBase } from '@app/core/component.base';
import brandLogoUrl from '@assets/icons/brand-logo.svg';
import './header.scss';

interface HeaderOptions {
  onBurgerClick: () => void;
  onAuthClick: (mode: 'login' | 'signup') => void;
}

const NAV_LINKS = ['Home', 'Library', 'Tournaments', 'Community'];

export class Header extends ComponentBase {
  private options: HeaderOptions;

  constructor(options: HeaderOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const header = document.createElement('header');
    header.classList.add('header');

    header.innerHTML = `
  <div class="header__inner">
    <a href="/" class="header__logo" aria-label="MiniGames home">
      <img src="${brandLogoUrl}" alt="" width="32" height="32" class="header__logo-icon" />
      <span class="header__logo-text">MiniGames</span>
    </a>

    <div class="header__right">
      <nav class="header__nav" aria-label="Primary">
        <ul class="header__nav-list">
          ${NAV_LINKS.map(
            (link, index) => `
            <li>
              <a href="/" class="header__nav-link${index === 0 ? ' header__nav-link--active' : ''}">${link}</a>
            </li>`,
          ).join('')}
        </ul>
      </nav>

      <div class="header__actions">
        <button type="button" class="header__auth-btn header__auth-btn--outlined" data-auth="login">Log In</button>
        <button type="button" class="header__auth-btn header__auth-btn--filled" data-auth="signup">Sign Up</button>
      </div>

      <button type="button" class="header__burger" aria-label="Open menu">
        <span class="header__burger-line"></span>
        <span class="header__burger-line"></span>
        <span class="header__burger-line"></span>
      </button>
    </div>
  </div>
    `;

    this.bindEvents(header);

    return header;
  }

  private bindEvents(header: HTMLElement): void {
    header
      .querySelector<HTMLButtonElement>('.header__burger')
      ?.addEventListener('click', () => this.options.onBurgerClick());

    const authButtons = header.querySelectorAll<HTMLButtonElement>('.header__auth-btn');

    for (const button of authButtons) {
      button.addEventListener('click', () => {
        const mode = button.dataset.auth === 'signup' ? 'signup' : 'login';
        this.options.onAuthClick(mode);
      });
    }
  }
}
