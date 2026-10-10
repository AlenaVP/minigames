import type { Guard } from '@shared/utils/type-guards';
import { HttpError, getHttpErrorKind, toTransportError } from './http-error';

export type QueryValue = string | number | boolean | undefined;
export type QueryParameters = Readonly<Record<string, QueryValue>>;

export interface HttpClientConfig {
  baseUrl: string;
  timeoutMs: number;
}

export interface GetOptions<T> {
  /** Runtime check of the JSON body: the API is external, so TypeScript alone can't vouch for its shape */
  guard: Guard<T>;
  /** undefined values are skipped: { page: 2, sort: undefined } → ?page=2 */
  query?: QueryParameters;
  /** Lets the caller cancel the request (newer request won, component destroyed) */
  signal?: AbortSignal;
}

/** Thin fetch wrapper — the role Angular's HttpClient plays: one place for base URL, timeout and error mapping. */
export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  async get<T>(path: string, { guard, query, signal }: GetOptions<T>): Promise<T> {
    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let response: Response;
    let body: unknown;

    try {
      response = await fetch(this.buildUrl(path, query), {
        headers: { Accept: 'application/json' },
        signal: combinedSignal,
      });
      body = await readJson(response);
    } catch (error) {
      throw toTransportError(error);
    }

    if (!response.ok) {
      throw new HttpError(getHttpErrorKind(response.status), { status: response.status, message: readErrorMessage(body) });
    }

    if (!guard(body)) {
      throw new HttpError('invalid-response', { status: response.status });
    }

    return body;
  }

  private buildUrl(path: string, query: QueryParameters = {}): URL {
    const url = new URL(`${this.config.baseUrl}${path}`);

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    return url;
  }
}

/** null instead of a throw for an empty or non-JSON body (e.g. an HTML error page from a proxy) */
async function readJson(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;

  try {
    const parsed: unknown = JSON.parse(text);
    return parsed;
  } catch {
    return null;
  }
}

/** Every API error looks like { "error": "Invalid page parameter" } */
function readErrorMessage(body: unknown): string | undefined {
  if (typeof body !== 'object' || body === null || !('error' in body)) return undefined;
  return typeof body.error === 'string' && body.error.trim() ? body.error : undefined;
}
