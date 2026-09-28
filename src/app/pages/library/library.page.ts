import { ComponentBase } from '@app/core/component.base';
import './library.page.scss';

// Markup of the intro only. Chips, sort, cards and pagination come in the next steps
export class LibraryPage extends ComponentBase {
  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('library-page');

    page.innerHTML = `
      <section class="library" aria-labelledby="library-title">
        <div class="library__intro">
          <h1 id="library-title" class="library__title">Game Library</h1>
          <p class="library__subtitle">Browse our collection of casual mini-games</p>
        </div>
      </section>
    `;

    return page;
  }
}
