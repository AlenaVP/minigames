import { ComponentBase } from '@app/core/component.base';
import brandLogoUrl from '@assets/icons/brand-logo.svg';
import './footer.scss';

const EXPLORE_LINKS = ['Home', 'Library', 'Categories', 'Tournaments'];
const COMPANY_LINKS = ['About Us', 'Contact', 'Privacy Policy', 'Terms of Service'];

export class Footer extends ComponentBase {
  protected render(): HTMLElement {
    const footer = document.createElement('footer');
    footer.classList.add('footer');

    footer.innerHTML = `
      <div class="footer__inner">
        <div class="footer__top">
          <div class="footer__brand">
            <a href="/" class="footer__logo" aria-label="MiniGames home">
              <img src="${brandLogoUrl}" alt="" width="32" height="32" class="footer__logo-icon" />
              <span class="footer__logo-text">MiniGames</span>
            </a>
            <p class="footer__description">
              Take a short break and have fun. Hundreds of curated casual mini-games right in your
              web browser. No download required.
            </p>
          </div>

          <div class="footer__columns">
            <div class="footer__col">
              <h3 class="footer__col-title">Explore</h3>
              <ul class="footer__col-list">
                ${EXPLORE_LINKS.map((link) => `<li><a href="/" class="footer__link">${link}</a></li>`).join('')}
              </ul>
            </div>

            <div class="footer__col">
              <h3 class="footer__col-title">Company</h3>
              <ul class="footer__col-list">
                ${COMPANY_LINKS.map((link) => `<li><a href="/" class="footer__link">${link}</a></li>`).join('')}
              </ul>
            </div>

            <div class="footer__col footer__col--community">
              <h3 class="footer__col-title">Community</h3>
              <div class="footer__social">
                <a href="/" class="footer__social-link" aria-label="Share">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="6" cy="12" r="2.5" stroke="currentColor" stroke-width="1.5" />
                    <circle cx="18" cy="6" r="2.5" stroke="currentColor" stroke-width="1.5" />
                    <circle cx="18" cy="18" r="2.5" stroke="currentColor" stroke-width="1.5" />
                    <path d="M8.2 10.8 15.8 7.2M8.2 13.2l7.6 3.6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </a>
                <a href="/" class="footer__social-link" aria-label="Chat">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path
                      d="M4 12a8 8 0 1 1 3.2 6.4L4 19l1.2-3.4A7.96 7.96 0 0 1 4 12Z"
                      stroke="currentColor"
                      stroke-width="1.5"
                      stroke-linejoin="round"
                    />
                  </svg>
                </a>
                <a href="/" class="footer__social-link" aria-label="RSS Feed">
                  <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <circle cx="6" cy="18" r="1.5" fill="currentColor" />
                    <path d="M4 11a9 9 0 0 1 9 9M4 5a15 15 0 0 1 15 15" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        <div class="footer__bottom">
          <p class="footer__copyright">© 2026 MiniGames. All rights reserved.</p>

          <div class="footer__credits">

            <a href="https://rs.school/courses/short-track"
              class="footer__credit-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <span class="footer__credit-badge">RS</span> RS School
            </a>

            <a href="https://github.com/AlenaVP"
              class="footer__credit-link"
              target="_blank"
              rel="noopener noreferrer"
            >
              <svg class="footer__credit-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M9 18c-4.5 1.5-4.5-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2-.2 4-1 4-4.5a3.5 3.5 0 0 0-1-2.5 3.3 3.3 0 0 0-.1-2.5s-.9-.3-3 1a10.2 10.2 0 0 0-5.5 0c-2.1-1.3-3-1-3-1a3.3 3.3 0 0 0-.1 2.5A3.5 3.5 0 0 0 5 10c0 3.5 2 4.3 4 4.5-.5.5-.5 1-.5 1.5V19"
                  stroke="currentColor"
                  stroke-width="1.5"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
              AlenaVP
            </a>
          </div>

          <p class="footer__made-with">Designed with love</p>
        </div>
      </div>
    `;

    return footer;
  }
}
