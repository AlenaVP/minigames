import { ComponentBase } from '@app/core/component.base';
import './header.scss';

export class Header extends ComponentBase {
  protected render(): HTMLElement {
    const header = document.createElement('header');
    header.classList.add('header');

    header.innerHTML = `<div class="header__inner"></div>`;

    return header;
  }
}
