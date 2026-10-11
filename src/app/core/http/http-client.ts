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

export interface PostOptions<T> {
  guard: Guard<T>;
  /** Not for "undo": aborting a POST stops waiting for the answer, not the server — the outcome becomes unknown */
  signal?: AbortSignal;
}

type JsonBody = Readonly<Record<string, unknown>>;

interface RequestSpec<T> {
  method: 'GET' | 'POST';
  guard: Guard<T>;
  query?: QueryParameters;
  body?: JsonBody;
  signal?: AbortSignal;
}

/** Thin fetch wrapper — the role Angular's HttpClient plays: one place for base URL, timeout and error mapping. */
export class HttpClient {
  private readonly config: HttpClientConfig;

  constructor(config: HttpClientConfig) {
    this.config = config;
  }

  get<T>(path: string, { guard, query, signal }: GetOptions<T>): Promise<T> {
    return this.request(path, { method: 'GET', guard, query, signal });
  }

  /** JSON in, JSON out: POST /games/{slug}/favorite { userEmail } and the other mutations */
  post<T>(path: string, body: JsonBody, { guard, signal }: PostOptions<T>): Promise<T> {
    return this.request(path, { method: 'POST', guard, body, signal });
  }

  private async request<T>(path: string, { method, guard, query, body, signal }: RequestSpec<T>): Promise<T> {
    const timeout = AbortSignal.timeout(this.config.timeoutMs);
    const combinedSignal = signal ? AbortSignal.any([signal, timeout]) : timeout;

    let response: Response;
    let responseBody: unknown;

    try {
      response = await fetch(this.buildUrl(path, query), {
        method,
        headers: body === undefined ? { Accept: 'application/json' } : JSON_HEADERS,
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: combinedSignal,
      });
      responseBody = await readJson(response);
    } catch (error) {
      throw toTransportError(error);
    }

    if (!response.ok) {
      throw new HttpError(getHttpErrorKind(response.status), {
        status: response.status,
        message: readErrorMessage(responseBody),
      });
    }

    if (!guard(responseBody)) {
      throw new HttpError('invalid-response', { status: response.status });
    }

    return responseBody;
  }

  private buildUrl(path: string, query: QueryParameters = {}): URL {
    const url = new URL(`${this.config.baseUrl}${path}`);

    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) url.searchParams.set(key, String(value));
    }

    return url;
  }
}

/** The API's CORS allows exactly this header (access-control-allow-headers: Content-Type) */
const JSON_HEADERS = { Accept: 'application/json', 'Content-Type': 'application/json' } as const;

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
