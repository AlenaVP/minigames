import { describe, expect, it, vi } from 'vitest';
import { jsonResponse, requestInit, requestedUrl, stubFetch, textResponse } from '@testing/http';
import { isNumber } from '@shared/utils/type-guards';
import { HttpClient } from './http-client';

const BASE_URL = 'https://api.example.com/api';

function createClient(timeoutMs = 10_000): HttpClient {
  return new HttpClient({ baseUrl: BASE_URL, timeoutMs });
}

const isAnswer = (value: unknown): value is { answer: number } =>
  typeof value === 'object' && value !== null && 'answer' in value && isNumber(value.answer);

/** A server that never answers: fetch settles only when its signal aborts, like the real one */
function stubHangingFetch(): void {
  vi.stubGlobal(
    'fetch',
    vi.fn(
      (_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener('abort', () => reject(init.signal?.reason));
        }),
    ),
  );
}

describe('HttpClient.get', () => {
  it('returns the body once the guard accepts it', async () => {
    stubFetch(jsonResponse({ answer: 42 }));
    await expect(createClient().get('/answer', { guard: isAnswer })).resolves.toEqual({ answer: 42 });
  });

  it('keeps the /api prefix of the base URL and sends only defined query values', async () => {
    const fetchMock = stubFetch(jsonResponse({ answer: 1 }));

    await createClient().get('/games', {
      guard: isAnswer,
      query: { category: 'puzzle', page: 2, featured: false, sort: undefined },
    });

    const url = requestedUrl(fetchMock);
    expect(url.origin + url.pathname).toBe(`${BASE_URL}/games`);
    expect([...url.searchParams]).toEqual([
      ['category', 'puzzle'],
      ['page', '2'],
      ['featured', 'false'],
    ]);
    expect(requestInit(fetchMock).headers).toEqual({ Accept: 'application/json' });
  });

  it('maps an error status to its kind and keeps the message from { error }', async () => {
    stubFetch(jsonResponse({ error: 'Invalid page parameter' }, 400));

    await expect(createClient().get('/games', { guard: isAnswer })).rejects.toMatchObject({
      kind: 'bad-request',
      status: 400,
      message: 'Invalid page parameter',
    });
  });

  it('falls back to the default message when the error body is not JSON', async () => {
    stubFetch(textResponse('<html>Bad gateway</html>', 502));

    await expect(createClient().get('/games', { guard: isAnswer })).rejects.toMatchObject({
      kind: 'server',
      message: 'Something went wrong on the server.',
    });
  });

  it('rejects a 200 response whose body fails the guard as invalid-response', async () => {
    stubFetch(jsonResponse({ answer: 'forty-two' }));
    await expect(createClient().get('/answer', { guard: isAnswer })).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('treats an empty 200 body as invalid-response instead of crashing on JSON.parse', async () => {
    stubFetch(textResponse(''));
    await expect(createClient().get('/answer', { guard: isAnswer })).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('turns a failed connection into a network error', async () => {
    stubFetch(new TypeError('Failed to fetch'));
    await expect(createClient().get('/answer', { guard: isAnswer })).rejects.toMatchObject({ kind: 'network' });
  });

  it('reports a request cancelled by the caller as aborted', async () => {
    stubHangingFetch();
    const controller = new AbortController();

    const request = createClient().get('/answer', { guard: isAnswer, signal: controller.signal });
    controller.abort();

    await expect(request).rejects.toMatchObject({ kind: 'aborted' });
  });

  it('gives up after timeoutMs and reports a timeout', async () => {
    stubHangingFetch();
    await expect(createClient(5).get('/answer', { guard: isAnswer })).rejects.toMatchObject({ kind: 'timeout' });
  });
});

describe('HttpClient.post', () => {
  it('sends the body as JSON with its content type and returns the checked answer', async () => {
    const fetchMock = stubFetch(jsonResponse({ answer: 7 }));

    await expect(createClient().post('/games/palia/favorite', { userEmail: 'a@b.c' }, { guard: isAnswer })).resolves.toEqual(
      {
        answer: 7,
      },
    );

    expect(requestedUrl(fetchMock).href).toBe(`${BASE_URL}/games/palia/favorite`);
    const init = requestInit(fetchMock);
    expect(init.method).toBe('POST');
    expect(init.headers).toEqual({ Accept: 'application/json', 'Content-Type': 'application/json' });
    expect(JSON.parse(String(init.body))).toEqual({ userEmail: 'a@b.c' });
  });

  it('keeps GET free of a body and of the JSON content type (no CORS preflight for reads)', async () => {
    const fetchMock = stubFetch(jsonResponse({ answer: 1 }));

    await createClient().get('/x', { guard: isAnswer });

    expect(requestInit(fetchMock).method).toBe('GET');
    expect(requestInit(fetchMock).body).toBeUndefined();
  });

  it('maps 401 to unauthorized with the server message', async () => {
    stubFetch(jsonResponse({ error: 'Authentication required: userEmail is missing' }, 401));

    await expect(createClient().post('/x', {}, { guard: isAnswer })).rejects.toMatchObject({
      kind: 'unauthorized',
      status: 401,
      message: 'Authentication required: userEmail is missing',
    });
  });

  it('reports a 2xx answer it cannot read as invalid-response (the change may still have happened)', async () => {
    stubFetch(textResponse('<html>', 201));

    await expect(createClient().post('/x', {}, { guard: isAnswer })).rejects.toMatchObject({ kind: 'invalid-response' });
  });

  it('gives up after timeoutMs like GET', async () => {
    stubHangingFetch();

    await expect(createClient(5).post('/x', {}, { guard: isAnswer })).rejects.toMatchObject({ kind: 'timeout' });
  });
});
