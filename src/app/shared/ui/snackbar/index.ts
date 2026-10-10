import { ComponentBase } from '@app/core/component.base';
import { escapeHtml } from '@shared/utils/escape-html';
import { PausableTimer } from '@shared/utils/pausable-timer';
import { checkCircleIcon, closeIcon, errorIcon, infoIcon, warningIcon } from '../icons';
import './snackbar.scss';

export type SnackbarVariant = 'success' | 'error' | 'warning' | 'info';

export interface SnackbarMessage {
  variant: SnackbarVariant;
  text: string;
  /** ms; by default errors stay a little longer — they take longer to read and act on */
  duration?: number;
}

const DEFAULT_DURATION: Record<SnackbarVariant, number> = {
  success: 4000,
  info: 4000,
  warning: 6000,
  error: 6000,
};

const VARIANT_ICON: Record<SnackbarVariant, (size: number) => string> = {
  success: checkCircleIcon,
  error: errorIcon,
  warning: warningIcon,
  info: infoIcon,
};

/** Handle to one shown message — like MatSnackBarRef in Angular: the caller can take it back early */
export interface SnackbarHandle {
  dismiss: () => void;
}

const NOOP_HANDLE: SnackbarHandle = { dismiss: () => {} };

/** Older messages are pushed out: a burst of failures must not cover the page */
const MAX_VISIBLE = 3;

interface ActiveItem {
  key: string;
  element: HTMLElement;
  timer: PausableTimer;
}

/**
 * App-wide toast notifications (the MatSnackBar analogue): call `snackbar.error('…')` from anywhere.
 *
 * Layering: a modal <dialog> sits in the browser's top layer and makes the rest of the page inert.
 * So the container is a `popover` (top layer too) that moves INTO the open modal dialog:
 * it stays above the dialog, clickable and audible to screen readers.
 */
export class Snackbar extends ComponentBase {
  private items: ActiveItem[] = [];

  success(text: string): SnackbarHandle {
    return this.show({ variant: 'success', text });
  }

  error(text: string): SnackbarHandle {
    return this.show({ variant: 'error', text });
  }

  warning(text: string): SnackbarHandle {
    return this.show({ variant: 'warning', text });
  }

  info(text: string): SnackbarHandle {
    return this.show({ variant: 'info', text });
  }

  show({ variant, text, duration = DEFAULT_DURATION[variant] }: SnackbarMessage): SnackbarHandle {
    if (!this.element) return NOOP_HANDLE;
    this.relocate();

    const key = `${variant}:${text}`;
    const existing = this.items.find((item) => item.key === key);
    if (existing) {
      existing.timer.start();
      return this.createHandle(existing);
    }

    const element = this.createItem(variant, text);
    const item: ActiveItem = { key, element, timer: new PausableTimer(() => this.dismiss(item), duration) };

    element.addEventListener('pointerenter', () => item.timer.pause());
    element.addEventListener('pointerleave', () => item.timer.resume());
    element.addEventListener('focusin', () => item.timer.pause());
    element.addEventListener('focusout', () => item.timer.resume());
    element.querySelector('.snackbar__close')?.addEventListener('click', () => this.dismiss(item));

    this.items.push(item);
    this.element.append(element);
    item.timer.start();

    if (this.items.length > MAX_VISIBLE) this.dismiss(this.items[0]);

    return this.createHandle(item);
  }

  destroy(): void {
    for (const item of this.items) item.timer.stop();
    this.items = [];
    super.destroy();
  }

  protected render(): HTMLElement {
    const container = document.createElement('div');
    container.classList.add('snackbar');
    container.popover = 'manual';
    container.setAttribute('role', 'region');
    container.setAttribute('aria-label', 'Notifications');
    container.setAttribute('aria-live', 'polite');

    document.addEventListener(
      'toggle',
      (event) => {
        if (event.target instanceof HTMLDialogElement) this.relocate();
      },
      { capture: true, signal: this.destroySignal },
    );

    return container;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    this.element?.showPopover();
  }

  private relocate(): void {
    if (!this.element) return;

    const host = document.querySelector('dialog:modal') ?? document.body;
    if (this.element.parentElement === host && this.element.matches(':popover-open')) return;

    host.append(this.element);
    this.element.showPopover();
  }

  private createHandle(item: ActiveItem): SnackbarHandle {
    return { dismiss: () => this.dismiss(item) };
  }

  private createItem(variant: SnackbarVariant, text: string): HTMLElement {
    const element = document.createElement('div');
    element.classList.add('snackbar__item', `snackbar__item--${variant}`);
    element.innerHTML = `
      <span class="snackbar__icon">${VARIANT_ICON[variant](24)}</span>
      <p class="snackbar__text">${escapeHtml(text)}</p>
      <button type="button" class="snackbar__close" aria-label="Dismiss notification">${closeIcon(20)}</button>
    `;
    return element;
  }

  private dismiss(item: ActiveItem): void {
    if (!this.items.includes(item)) return;

    item.timer.stop();
    this.items = this.items.filter((active) => active !== item);
    item.element.classList.add('snackbar__item--leaving');

    void Promise.allSettled(item.element.getAnimations().map((animation) => animation.finished)).then(() =>
      item.element.remove(),
    );
  }
}

/** The single app-wide instance — mounted once in core/app.ts */
export const snackbar = new Snackbar();
