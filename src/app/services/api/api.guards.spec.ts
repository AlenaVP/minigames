import { describe, expect, it } from 'vitest';
import { makeCategory, makeComment, makeGameDetails, makeGameSummary, makeLeaderboardEntry } from '@testing/fixtures';
import {
  isCategoriesResponse,
  isCommentsResponse,
  isFeaturedGamesResponse,
  isGameDetailsResponse,
  isGamesPageResponse,
  isLeaderboardResponse,
} from './api.guards';

const pageMeta = { page: 1, limit: 6, totalItems: 1, totalPages: 1 };

describe('API response guards', () => {
  it('accept valid responses of every endpoint', () => {
    expect(isCategoriesResponse({ data: [makeCategory()], meta: {} })).toBe(true);
    expect(isLeaderboardResponse({ data: [makeLeaderboardEntry()], meta: {} })).toBe(true);
    expect(isFeaturedGamesResponse({ data: [makeGameSummary()], meta: { total: 1 } })).toBe(true);
    expect(isGamesPageResponse({ data: [makeGameSummary()], meta: pageMeta })).toBe(true);
    expect(isGameDetailsResponse({ data: makeGameDetails() })).toBe(true);
    expect(isCommentsResponse({ data: [makeComment()], meta: { totalComments: 1, returnedCount: 1 } })).toBe(true);
  });

  it('accept fields the backend may add later', () => {
    expect(isGameDetailsResponse({ data: { ...makeGameDetails(), trailerUrl: 'x' }, requestId: 'r-1' })).toBe(true);
  });

  it('reject a missing envelope or meta', () => {
    expect(isGamesPageResponse([makeGameSummary()])).toBe(false);
    expect(isGamesPageResponse({ data: [makeGameSummary()] })).toBe(false);
    expect(isCommentsResponse({ data: [], meta: { totalComments: 0 } })).toBe(false);
  });

  it('reject an item with a wrong field deep inside', () => {
    const badRecord = makeGameDetails({ topRecords: [{ position: 1, playerName: 'A', score: 10, achievedAt: 5 } as never] });
    expect(isGameDetailsResponse({ data: badRecord })).toBe(false);
    expect(
      isCommentsResponse({ data: [{ ...makeComment(), likesCount: '3' }], meta: { totalComments: 1, returnedCount: 1 } }),
    ).toBe(false);
  });

  it('reject an error body that came with a 200 status', () => {
    expect(isCategoriesResponse({ error: 'Something went wrong' })).toBe(false);
  });
});
