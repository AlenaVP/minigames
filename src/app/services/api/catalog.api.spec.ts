import { describe, expect, it } from 'vitest';
import { HttpClient } from '@app/core/http';
import { makeCategory, makeLeaderboardEntry } from '@testing/fixtures';
import { jsonResponse, requestedUrl, stubFetch } from '@testing/http';
import { CatalogApi } from './catalog.api';

function createApi(): CatalogApi {
  return new CatalogApi(new HttpClient({ baseUrl: 'https://api.example.com/api', timeoutMs: 1000 }));
}

describe('CatalogApi.getCategories', () => {
  const categories = [makeCategory({ slug: 'all', isDefault: true }), makeCategory()];

  it('asks the server once and shares the result with every caller (shareReplay)', async () => {
    const fetchMock = stubFetch(jsonResponse({ data: categories, meta: {} }));
    const api = createApi();

    const [first, second] = await Promise.all([api.getCategories(), api.getCategories()]);
    const third = await api.getCategories();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(requestedUrl(fetchMock).pathname).toBe('/api/categories');
    expect(first).toEqual(categories);
    expect(second).toBe(first);
    expect(third).toBe(first);
  });

  it('does not cache a failure, so Retry asks the server again', async () => {
    const fetchMock = stubFetch(
      jsonResponse({ error: 'Internal error' }, 500),
      jsonResponse({ data: categories, meta: {} }),
    );
    const api = createApi();

    await expect(api.getCategories()).rejects.toMatchObject({ kind: 'server' });
    await expect(api.getCategories()).resolves.toEqual(categories);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

describe('CatalogApi.getLeaderboard', () => {
  it('returns the leaderboard entries', async () => {
    const entries = [makeLeaderboardEntry(), makeLeaderboardEntry({ rank: 2, playerName: 'Alex_Pro99' })];
    const fetchMock = stubFetch(jsonResponse({ data: entries, meta: {} }));

    await expect(createApi().getLeaderboard()).resolves.toEqual(entries);
    expect(requestedUrl(fetchMock).pathname).toBe('/api/leaderboard');
  });
});
