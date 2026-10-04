/**
 * - aborted: we cancelled the request ourselves (newer request won, component destroyed) — not shown to the user
 * - timeout / network / server / rate-limit / invalid-response: transient — worth a Retry
 * - not-found / bad-request: retrying the same request gives the same answer
 */
export type HttpErrorKind =
  'aborted' | 'timeout' | 'network' | 'server' | 'rate-limit' | 'invalid-response' | 'not-found' | 'bad-request';

const DEFAULT_MESSAGES: Record<HttpErrorKind, string> = {
  aborted: 'The request was cancelled.',
  timeout: 'The server is taking too long to respond.',
  network: 'No connection to the server. Check your internet connection.',
  server: 'Something went wrong on the server.',
  'rate-limit': 'Too many requests. Please try again in a moment.',
  'invalid-response': 'The server sent an unexpected response.',
  'not-found': 'The requested data was not found.',
  'bad-request': 'The request was rejected by the server.',
};

const RETRYABLE_KINDS: ReadonlySet<HttpErrorKind> = new Set([
  'timeout',
  'network',
  'server',
  'rate-limit',
  'invalid-response',
]);

export class HttpError extends Error {
  readonly kind: HttpErrorKind;
  /** HTTP status, or null when no response arrived at all (network, timeout, aborted) */
  readonly status: number | null;

  constructor(kind: HttpErrorKind, options: { message?: string; status?: number; cause?: unknown } = {}) {
    super(options.message ?? DEFAULT_MESSAGES[kind], { cause: options.cause });
    this.name = 'HttpError';
    this.kind = kind;
    this.status = options.status ?? null;
  }

  get isRetryable(): boolean {
    return RETRYABLE_KINDS.has(this.kind);
  }
}

export function getHttpErrorKind(status: number): HttpErrorKind {
  if (status === 404) return 'not-found';
  if (status === 429) return 'rate-limit';
  if (status >= 500) return 'server';
  return 'bad-request';
}

/**
 * fetch() rejects with the signal's reason:
 * - AbortSignal.timeout() → DOMException 'TimeoutError'
 * - controller.abort()    → DOMException 'AbortError'
 * - no connection / CORS  → TypeError
 */
export function toTransportError(error: unknown): HttpError {
  if (error instanceof HttpError) return error;
  if (error instanceof DOMException && error.name === 'TimeoutError') return new HttpError('timeout', { cause: error });
  if (error instanceof DOMException && error.name === 'AbortError') return new HttpError('aborted', { cause: error });
  return new HttpError('network', { cause: error });
}

export function isAbortedRequest(error: unknown): boolean {
  return error instanceof HttpError && error.kind === 'aborted';
}
