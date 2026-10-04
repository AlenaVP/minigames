import { ComponentBase } from '@app/core/component.base';
import { escapeHtml } from '@shared/utils/escape-html';
import { searchOffIcon } from '../icons';
import './empty-state.scss';

export interface EmptyStateOptions {
  /** "Data Not Found" */
  title: string;
  message?: string;
  /** A way out, e.g. "Close" in the Game Not Found dialog state */
  action?: { label: string; onClick: () => void };
}

/**
 * "The request worked, there is just nothing to show" — deliberately unlike ErrorBanner:
 * neutral colours, dashed frame, no shadow, no Retry (repeating the same request returns the same empty list).
 */
export class EmptyState extends ComponentBase {
  private readonly options: EmptyStateOptions;

  constructor(options: EmptyStateOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { title, message, action } = this.options;

    const element = document.createElement('div');
    element.classList.add('empty-state');
    element.innerHTML = `
      <span class="empty-state__icon">${searchOffIcon(48)}</span>
      <p class="empty-state__title">${escapeHtml(title)}</p>
      ${message ? `<p class="empty-state__message">${escapeHtml(message)}</p>` : ''}
      ${action ? `<button type="button" class="empty-state__action">${escapeHtml(action.label)}</button>` : ''}
    `;

    if (action) element.querySelector('.empty-state__action')?.addEventListener('click', action.onClick);

    return element;
  }
}
