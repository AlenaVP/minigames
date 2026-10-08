import { describe, expect, it } from 'vitest';
import { HttpClient, HttpError } from '@app/core/http';
import { makeComment, makeGameDetails, makeGameSummary } from '@testing/fixtures';
import { jsonResponse, requestInit, requestedUrl, stubFetch } from '@testing/http';
import { GamesApi } from './games.api';

const BASE_URL = 'https://api.example.com/api';

function createApi(): GamesApi {
  return new GamesApi(new HttpClient({ baseUrl: BASE_URL, timeoutMs: 1000 }));
}

describe('GamesApi', () => {
  it('getFeatured asks only for featured games and returns the list', async () => {
    const games = [makeGameSummary(), makeGameSummary({ slug: 'palia', name: 'Palia' })];
    const fetchMock = stubFetch(jsonResponse({ data: games, meta: {} }));

    await expect(createApi().getFeatured()).resolves.toEqual(games);

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe('/api/games');
    expect(url.search).toBe('?featured=true');
  });

  it('getGames sends filter, sort, page and limit to the server and maps the meta', async () => {
    const games = [makeGameSummary()];
    const fetchMock = stubFetch(jsonResponse({ data: games, meta: { page: 2, limit: 6, totalItems: 8, totalPages: 2 } }));

    const page = await createApi().getGames({ category: 'puzzle', sort: 'name-asc', page: 2, limit: 6 });

    expect(Object.fromEntries(requestedUrl(fetchMock).searchParams)).toEqual({
      category: 'puzzle',
      sort: 'name-asc',
      page: '2',
      limit: '6',
    });
    expect(page).toEqual({ games, page: 2, totalPages: 2, totalItems: 8 });
  });

  it('getGame encodes the slug into the path', async () => {
    const details = makeGameDetails();
    const fetchMock = stubFetch(jsonResponse({ data: details }));

    await expect(createApi().getGame('a/b c')).resolves.toEqual(details);
    expect(requestedUrl(fetchMock).pathname).toBe('/api/games/a%2Fb%20c');
  });

  it('getGame turns 404 into a not-found error (the "Game Not Found" state)', async () => {
    stubFetch(jsonResponse({ error: 'Game not found' }, 404));

    await expect(createApi().getGame('missing')).rejects.toMatchObject({ kind: 'not-found', message: 'Game not found' });
  });

  it('getComments sends limit and sort and returns the comments with the total count', async () => {
    const comments = [makeComment()];
    const fetchMock = stubFetch(jsonResponse({ data: comments, meta: { totalComments: 12, returnedCount: 1 } }));

    const page = await createApi().getComments('tiny-glade', { limit: 5, sort: 'newest' });

    const url = requestedUrl(fetchMock);
    expect(url.pathname).toBe('/api/games/tiny-glade/comments');
    expect(Object.fromEntries(url.searchParams)).toEqual({ limit: '5', sort: 'newest' });
    expect(page).toEqual({ comments, total: 12 });
  });

  it('getComments without options sends no query at all', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [], meta: { totalComments: 0, returnedCount: 0 } }));

    await createApi().getComments('tiny-glade');

    expect(requestedUrl(fetchMock).search).toBe('');
  });

  it('passes the caller signal through, so a destroyed component cancels its request', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: [], meta: {} }));
    const controller = new AbortController();

    await createApi().getFeatured(controller.signal);
    controller.abort();

    expect(requestInit(fetchMock).signal?.aborted).toBe(true);
  });

  it('propagates server errors as HttpError', async () => {
    stubFetch(jsonResponse({ error: 'Rate limit exceeded' }, 429));
    await expect(createApi().getFeatured()).rejects.toBeInstanceOf(HttpError);
  });
});
