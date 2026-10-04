import { ComponentBase } from '@app/core/component.base';
import type { HttpError } from '@app/core/http';
import { escapeHtml } from '@shared/utils/escape-html';
import { errorIcon, refreshIcon } from '../icons';
import './error-banner.scss';

export interface ErrorBannerOptions {
  /** "Couldn't load top players" */
  title: string;
  error: HttpError;
  /** The button appears only for errors a repeat can fix (network, timeout, 5xx, 429) */
  onRetry?: () => void;
}

/** Replaces a content area whose request failed. Not a live region: the error Snackbar already announces it. */
export class ErrorBanner extends ComponentBase {
  private readonly options: ErrorBannerOptions;

  constructor(options: ErrorBannerOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { title, error, onRetry } = this.options;
    const canRetry = Boolean(onRetry) && error.isRetryable;

    const banner = document.createElement('div');
    banner.classList.add('error-banner');
    banner.innerHTML = `
      <span class="error-banner__icon">${errorIcon(32)}</span>
      <div class="error-banner__text">
        <p class="error-banner__title">${escapeHtml(title)}</p>
        <p class="error-banner__message">${escapeHtml(error.message)}</p>
      </div>
      ${canRetry ? `<button type="button" class="error-banner__retry">${refreshIcon(20)}<span>Try again</span></button>` : ''}
    `;

    banner.querySelector('.error-banner__retry')?.addEventListener('click', () => onRetry?.());

    return banner;
  }
}
