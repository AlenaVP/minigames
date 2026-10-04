export abstract class ComponentBase {
  protected element: HTMLElement | null = null;
  private abortController: AbortController | null = null;
  private children: ComponentBase[] = [];

  protected abstract render(): HTMLElement;

  mount(parent: HTMLElement): void {
    this.abortController = new AbortController();
    this.element = this.render();
    parent.append(this.element);
  }

  destroy(): void {
    for (const child of this.children) child.destroy();
    this.children = [];

    this.abortController?.abort();
    this.abortController = null;

    this.element?.remove();
    this.element = null;
  }

  /**
   * For listeners on window/document/matchMedia — they outlive the element.
   * Usage: window.addEventListener('resize', handler, { signal: this.destroySignal });
   */
  protected get destroySignal(): AbortSignal {
    if (!this.abortController) {
      throw new Error(`${this.constructor.name}: destroySignal is only available after mount()`);
    }
    return this.abortController.signal;
  }

  /** Mounts a child and remembers it, so destroy() cascades down the tree (like Angular views). */
  protected mountChild<T extends ComponentBase>(child: T, parent: HTMLElement): T {
    child.mount(parent);
    this.children.push(child);
    return child;
  }

  /** For children that get replaced at runtime (loading → content → error): destroys one and forgets it. */
  protected destroyChild(child: ComponentBase): void {
    child.destroy();
    this.children = this.children.filter((item) => item !== child);
  }
}
