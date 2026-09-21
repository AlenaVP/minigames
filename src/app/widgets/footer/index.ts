import { ComponentBase } from '@app/core/component.base';
import './footer.scss';

export class Footer extends ComponentBase {
  protected render(): HTMLElement {
    const footer = document.createElement('footer');
    footer.classList.add('footer');

    footer.innerHTML = `<div class="footer__inner"></div>`;

    return footer;
  }
}
