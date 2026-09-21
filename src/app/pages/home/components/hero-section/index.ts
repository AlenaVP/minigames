import { ComponentBase } from '@app/core/component.base';
import './hero-section.scss';

export class HeroSection extends ComponentBase {
  protected render(): HTMLElement {
    const section = document.createElement('section');
    section.classList.add('hero');
    section.setAttribute('aria-labelledby', 'hero-title');

    section.innerHTML = `
      <div class="hero__card">
        <h1 id="hero-title" class="hero__title">Take a Short Break &amp; Have Fun</h1>
        <p class="hero__description">
          Discover hundreds of curated casual mini-games. Play instantly in your browser —
          puzzle, match 3, farm, and board classics.
        </p>
        <button type="button" class="hero__button">Browse Library</button>
      </div>
    `;

    return section;
  }
}
