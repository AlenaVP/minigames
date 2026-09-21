import { ComponentBase } from '@app/core/component.base';

export class HomePage extends ComponentBase {
  protected render(): HTMLElement {
    const page = document.createElement('div');
    page.classList.add('home-page');

    return page;
  }
}
