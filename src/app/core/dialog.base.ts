import { ComponentBase } from './component.base';

export interface DialogConfig {
  className: string;
  /** Accessible name: a text label… */
  ariaLabel?: string;
  /** …or the id of a heading inside the dialog */
  ariaLabelledBy?: string;
  /** Any way of closing (✕, backdrop, Esc, close()) — the app uses it to update the URL */
  onClose?: () => void;
}

/**
 * Shared behaviour of every modal (the Angular CDK Dialog analogue):
 * native <dialog> + showModal() (focus trap, Esc, top layer, inert page),
 * close on a backdrop click and on any [data-dialog-close] element.
 * Subclasses only render content and decide what "open" means for them.
 */
export abstract class DialogBase extends ComponentBase {
  protected dialog: HTMLDialogElement | null = null;
  private readonly config: DialogConfig;
  private isPointerDownOnBackdrop = false;
  private isDismissible = true;

  constructor(config: DialogConfig) {
    super();
    this.config = config;
  }

  protected abstract renderContent(dialog: HTMLDialogElement): void;

  get isOpen(): boolean {
    return this.dialog?.open ?? false;
  }

  close(): void {
    this.dialog?.close();
  }

  /**
   * false = the user cannot close the dialog (✕, backdrop, Esc) — e.g. while a request is pending.
   * close() from code still works (the URL can always close a dialog).
   *
   * Esc is blocked twice: closedby="none" (Chrome 134+: no close request at all) and preventDefault on
   * keydown/cancel — Chrome lets a page cancel the "cancel" event only once without a new user activation.
   */
  protected setDismissible(isDismissible: boolean): void {
    this.isDismissible = isDismissible;
    if (isDismissible) this.dialog?.removeAttribute('closedby');
    else this.dialog?.setAttribute('closedby', 'none');
  }

  protected show(): void {
    if (!this.dialog || this.dialog.open) return;
    this.dialog.showModal();
  }

  protected render(): HTMLElement {
    const { className, ariaLabel, ariaLabelledBy } = this.config;

    const dialog = document.createElement('dialog');
    dialog.classList.add(className);
    if (ariaLabel) dialog.setAttribute('aria-label', ariaLabel);
    if (ariaLabelledBy) dialog.setAttribute('aria-labelledby', ariaLabelledBy);

    this.dialog = dialog;
    this.renderContent(dialog);
    this.bindCloseTriggers(dialog);
    dialog.addEventListener('close', () => this.config.onClose?.());

    return dialog;
  }

  private bindCloseTriggers(dialog: HTMLDialogElement): void {
    dialog.addEventListener('pointerdown', (event) => {
      this.isPointerDownOnBackdrop = this.isBackdropEvent(event, dialog);
    });

    dialog.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && !this.isDismissible) event.preventDefault();
    });

    dialog.addEventListener('cancel', (event) => {
      if (!this.isDismissible) event.preventDefault();
    });

    dialog.addEventListener('click', (event) => {
      if (!this.isDismissible) return;

      const isBackdropClick = this.isPointerDownOnBackdrop && this.isBackdropEvent(event, dialog);
      const isCloseButton = event.target instanceof Element && event.target.closest('[data-dialog-close]');

      if (isBackdropClick || isCloseButton) this.close();
    });
  }

  /**
   * The ::backdrop has no DOM node of its own: a click on it arrives with the <dialog> as target.
   * A click on the dialog's own padding or scrollbar has the same target, so the pointer position
   * decides: only a point outside the dialog's box is the backdrop.
   */
  private isBackdropEvent(event: MouseEvent, dialog: HTMLDialogElement): boolean {
    if (event.target !== dialog) return false;

    const rect = dialog.getBoundingClientRect();
    return (
      event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom
    );
  }
}
