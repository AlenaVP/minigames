import { ComponentBase } from '@app/core/component.base';
import type { HttpError } from '@app/core/http';
import { type RemoteData, type RequestFactory, ResourceLoader } from '@shared/utils/resource-loader';
import { EmptyState } from '../empty-state';
import { ErrorBanner } from '../error-banner';
import { type SnackbarHandle, snackbar } from '../snackbar';
import './async-content.scss';

type View = ComponentBase | HTMLElement;

export interface AsyncContentOptions<T> {
  /** Lower-case noun for messages: 'top players' → "Couldn't load top players" / "Top players loaded" */
  label: string;
  /** Sent right after mount; omit it to start later with load() (e.g. when parameters come from the URL) */
  request?: RequestFactory<T>;
  renderSkeleton: () => HTMLElement;
  renderContent: (data: T) => View;
  isEmpty?: (data: T) => boolean;
  /** Default: EmptyState "Nothing to show yet" */
  renderEmpty?: (data: T) => View;
  /** Return a view to replace the default ErrorBanner for some errors (e.g. "Game Not Found"), or null to keep it */
  renderError?: (error: HttpError) => View | null;
  /** Lets the owner react to states outside this area (pagination, carousel autoplay…) */
  onStateChange?: (state: RemoteData<T>) => void;
}

/**
 * One data-driven area: skeleton → content | empty state | error banner with Retry.
 * The same pattern everywhere (Home, Library, Game Details) — like an Angular template with
 * `@switch (resource.status())` around a section.
 */
export class AsyncContent<T> extends ComponentBase {
  private readonly options: AsyncContentOptions<T>;
  private loader: ResourceLoader<T> | null = null;
  private view: View | null = null;
  /** The error toast of the last failure: removed as soon as the data arrives, so it can't contradict the page */
  private errorToast: SnackbarHandle | null = null;

  constructor(options: AsyncContentOptions<T>) {
    super();
    this.options = options;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    // Only now the area is in the DOM, so the skeleton has a place to go
    const { request } = this.options;
    if (request) void this.load(request);
  }

  load(request: RequestFactory<T>): Promise<void> {
    return this.loader?.load(request) ?? Promise.resolve();
  }

  retry(): Promise<void> {
    return this.loader?.retry() ?? Promise.resolve();
  }

  protected render(): HTMLElement {
    const { label } = this.options;

    const area = document.createElement('div');
    area.classList.add('async-content');
    // Focus target when the focused element (e.g. Retry) disappears with the old state
    area.tabIndex = -1;

    this.loader = new ResourceLoader<T>({
      destroySignal: this.destroySignal,
      isEmpty: this.options.isEmpty,
      onState: (state) => this.applyState(state),
      // "Not found" is an answer, not a failure: the area itself explains it, no toast
      onError: (error) => {
        if (error.kind !== 'not-found') this.errorToast = snackbar.error(`Couldn't load ${label}. ${error.message}`);
      },
      onRecovered: () => snackbar.success(`${capitalize(label)} loaded.`),
    });

    return area;
  }

  private applyState(state: RemoteData<T>): void {
    if (!this.element) return;

    const area = this.element;
    const hadFocus = area.contains(document.activeElement);

    this.clearView();
    if (state.status === 'success' || state.status === 'empty') {
      this.errorToast?.dismiss();
      this.errorToast = null;
    }
    area.setAttribute('aria-busy', String(state.status === 'loading'));

    switch (state.status) {
      case 'loading': {
        this.showView(this.createSkeleton());
        break;
      }
      case 'success': {
        this.showView(this.options.renderContent(state.data));
        break;
      }
      case 'empty': {
        this.showView(this.options.renderEmpty?.(state.data) ?? new EmptyState({ title: 'Nothing to show yet' }));
        break;
      }
      case 'error': {
        this.showView(this.options.renderError?.(state.error) ?? this.createErrorBanner(state.error));
        break;
      }
    }

    if (hadFocus && !area.contains(document.activeElement)) area.focus({ preventScroll: true });

    this.options.onStateChange?.(state);
  }

  private createSkeleton(): HTMLElement {
    const skeleton = this.options.renderSkeleton();
    // inert, not only aria-hidden: a placeholder may reuse real markup with buttons, which must not get focus
    skeleton.inert = true;

    const wrapper = document.createElement('div');
    wrapper.classList.add('async-content__loading');
    wrapper.innerHTML = `<span class="visually-hidden">Loading ${this.options.label}…</span>`;
    wrapper.append(skeleton);
    return wrapper;
  }

  private createErrorBanner(error: HttpError): ErrorBanner {
    return new ErrorBanner({
      title: `Couldn't load ${this.options.label}`,
      error,
      onRetry: () => void this.retry(),
    });
  }

  private showView(view: View): void {
    if (!this.element) return;

    if (view instanceof ComponentBase) {
      this.mountChild(view, this.element);
    } else {
      this.element.append(view);
    }
    this.view = view;
  }

  private clearView(): void {
    if (this.view instanceof ComponentBase) {
      this.destroyChild(this.view);
    } else {
      this.view?.remove();
    }
    this.view = null;
  }
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}
