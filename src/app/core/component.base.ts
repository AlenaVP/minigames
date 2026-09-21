export abstract class ComponentBase {
  protected element: HTMLElement | null = null;

  protected abstract render(): HTMLElement;

  mount(parent: HTMLElement): void {
    this.element = this.render();
    parent.append(this.element);
  }

  destroy(): void {
    this.element?.remove();
    this.element = null;
  }
}
