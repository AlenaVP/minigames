import { ComponentBase } from '@app/core/component.base';
import illustrationUrl from '@assets/images/illustration-slide.png';
import './developer-cta-section.scss';

export class DeveloperCtaSection extends ComponentBase {
  protected render(): HTMLElement {
    const section = document.createElement('section');
    section.classList.add('developer-cta');
    section.setAttribute('aria-labelledby', 'developer-cta-title');

    section.innerHTML = `
      <div class="developer-cta__inner">
        <img src="${illustrationUrl}" alt="" class="developer-cta__illustration" />
        <div class="developer-cta__card">
          <h2 id="developer-cta-title" class="developer-cta__title">Are You a Game Developer?</h2>

          <p class="developer-cta__description">
            Want to see your game on MiniGames? We're always looking for fun, <span class="nowrap">engaging mini games to add to our platform.</span> Submit your game <span class="nowrap">and reach thousands of players!</span>
          </p>

          <button type="button" class="developer-cta__button">
            <svg class="developer-cta__button-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M12 4v11m0-11 4 4m-4-4-4 4M5 17v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
            <span>Submit Form</span>
          </button>

          <p class="developer-cta__contact">
            or contact us at
            <a href="mailto:developers@minigames.com" class="developer-cta__contact-link">developers@minigames.com</a>
          </p>
        </div>
      </div>
    `;

    return section;
  }
}
