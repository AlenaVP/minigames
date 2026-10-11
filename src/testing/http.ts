import { type Mock, vi } from 'vitest';

export type FetchMock = Mock<typeof fetch>;

/** A real Response with a JSON body — what fetch() resolves with */
export function jsonResponse(body: unknown, status = 200): Response {
  return Response.json(body, { status });
}

/** A body that is not JSON (e.g. an HTML error page from a proxy) or empty */
export function textResponse(text: string, status = 200): Response {
  return new Response(text, { status });
}

/**
 * Replaces the global fetch for one test (restored automatically: unstubGlobals in vitest.config.ts).
 * Each call answers with the next queued response; the last one keeps being reused.
 */
export function stubFetch(...responses: (Response | Error)[]): FetchMock {
  let call = 0;

  const fetchMock: FetchMock = vi.fn(async () => {
    const next = responses[Math.min(call, responses.length - 1)];
    call += 1;
    if (next instanceof Error) throw next;
    return next.clone();
  });

  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

/** The URL of the n-th fetch call (0 = first) */
export function requestedUrl(fetchMock: FetchMock, callIndex = 0): URL {
  const [input] = fetchMock.mock.calls[callIndex] ?? [];
  if (input === undefined) throw new Error(`fetch was not called ${callIndex + 1} time(s)`);
  return new URL(input instanceof Request ? input.url : String(input));
}

/** The init (method, headers, signal) of the n-th fetch call */
export function requestInit(fetchMock: FetchMock, callIndex = 0): RequestInit {
  return fetchMock.mock.calls[callIndex]?.[1] ?? {};
}
