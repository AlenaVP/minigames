import { HttpError, isAbortedRequest } from '@app/core/http';

/** What a data-driven section can show. `empty` = the request succeeded but there is nothing to list. */
export type RemoteData<T> =
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'empty'; data: T }
  | { status: 'error'; error: HttpError };

export type RequestFactory<T> = (signal: AbortSignal) => Promise<T>;

export interface ResourceLoaderOptions<T> {
  onState: (state: RemoteData<T>) => void;
  /** Without it every successful response counts as `success` */
  isEmpty?: (data: T) => boolean;
  /** A request that failed and then succeeded on Retry (not on a new load() with other parameters) */
  onRecovered?: () => void;
  onError?: (error: HttpError) => void;
  /** The owner's destroySignal: the request in flight is cancelled together with the component */
  destroySignal?: AbortSignal;
}

/**
 * Runs one request at a time and turns it into RemoteData states — the job switchMap + a resource do in Angular:
 *
 *   load(A) ──► loading ─────────── (A aborted, ignored)
 *   load(B)       └─► loading ──► success(B)      ← only the LATEST request may update the UI
 *
 * No DOM inside → unit-testable in Story 4.
 */
export class ResourceLoader<T> {
  private readonly options: ResourceLoaderOptions<T>;
  private controller: AbortController | null = null;
  private lastRequest: RequestFactory<T> | null = null;

  constructor(options: ResourceLoaderOptions<T>) {
    this.options = options;
    options.destroySignal?.addEventListener('abort', () => this.abort(), { once: true });
  }

  load(request: RequestFactory<T>): Promise<void> {
    return this.run(request, false);
  }

  /** Re-sends the last request — what the Retry button calls */
  retry(): Promise<void> {
    return this.lastRequest ? this.run(this.lastRequest, true) : Promise.resolve();
  }

  abort(): void {
    this.controller?.abort();
    this.controller = null;
  }

  private async run(request: RequestFactory<T>, isRetry: boolean): Promise<void> {
    if (this.options.destroySignal?.aborted) return;

    this.abort();
    const controller = new AbortController();
    this.controller = controller;
    this.lastRequest = request;

    this.options.onState({ status: 'loading' });

    try {
      const data = await request(controller.signal);
      // A newer load() or abort() happened while we were waiting: this answer is stale
      if (controller !== this.controller) return;

      const isEmpty = this.options.isEmpty?.(data) ?? false;
      this.options.onState(isEmpty ? { status: 'empty', data } : { status: 'success', data });

      if (isRetry) this.options.onRecovered?.();
    } catch (error) {
      if (controller !== this.controller || isAbortedRequest(error)) return;

      const httpError = error instanceof HttpError ? error : new HttpError('invalid-response', { cause: error });
      this.options.onState({ status: 'error', error: httpError });
      this.options.onError?.(httpError);
    } finally {
      if (controller === this.controller) this.controller = null;
    }
  }
}
