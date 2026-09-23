import { ComponentBase } from '@app/core/component.base';
import brandLogoUrl from '@assets/icons/brand-logo.svg';
import './burger-menu.scss';

interface BurgerMenuOptions {
  onAuthClick: (mode: 'login' | 'signup') => void;
}

const NAV_LINKS = ['Home', 'Library', 'Tournaments', 'Community'];

export class BurgerMenu extends ComponentBase {
  private options: BurgerMenuOptions;
  private isOpen = false;

  constructor(options: BurgerMenuOptions) {
    super();
    this.options = options;
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
          <a href="/" class="burger-menu__logo" aria-label="MiniGames home">
          <img src="${brandLogoUrl}" alt="" width="32" height="32" class="burger-menu__logo-icon" />
          <span class="burger-menu__logo-text">MiniGames</span>
          </a>
          <button type="button" class="burger-menu__close" aria-label="Close menu">
            <span aria-hidden="true">&times;</span>
          </button>
        </div>

        <nav class="burger-menu__nav" aria-label="Primary">
          <ul class="burger-menu__nav-list">
            ${NAV_LINKS.map(
              (link, index) => `
              <li>
                <a href="/" class="burger-menu__nav-link${index === 0 ? ' burger-menu__nav-link--active' : ''}">${link}</a>
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

    // Force a reflow so the browser registers the initial state
    // (translateX(100%)) BEFORE adding the --open class — otherwise, the transition
    // won't trigger, and the element will appear immediately in its final position.
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

    const navLinks = dialog.querySelectorAll<HTMLAnchorElement>('.burger-menu__nav-link');

    for (const link of navLinks) {
      link.addEventListener('click', () => this.close());
    }
  }

  private onKeydown = (event: KeyboardEvent): void => {
    if (event.key === 'Escape' && this.isOpen) {
      this.close();
    }
  };
}
