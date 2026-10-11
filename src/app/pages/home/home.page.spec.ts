// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { catalogApi, gamesApi } from '@app/services/api';
import { snackbar } from '@shared/ui/snackbar';
import { query, queryAll, stubMatchMedia, textOf } from '@testing/dom';
import { makeGameSummary, makeLeaderboardEntry } from '@testing/fixtures';
import { HomePage } from './home.page';

describe('HomePage', () => {
  let page: HomePage;

  function mount(): void {
    page = new HomePage({ onGameDetails: vi.fn() });
    page.mount(document.body);
  }

  beforeEach(() => {
    stubMatchMedia(false);
    vi.spyOn(gamesApi, 'getFeatured').mockResolvedValue([makeGameSummary()]);
    vi.spyOn(snackbar, 'error');
  });

  afterEach(() => {
    page.destroy();
  });

  it('has one h1 (hero) and the four sections in order', async () => {
    vi.spyOn(catalogApi, 'getLeaderboard').mockResolvedValue([]);
    mount();

    expect(queryAll('h1')).toHaveLength(1);
    expect(queryAll('.home-page > *').map((section) => section.className.split(' ', 1)[0])).toEqual([
      'hero',
      'new-games',
      'top-players',
      expect.stringMatching(/^dev/),
    ]);
  });

  it('shows the leaderboard rows with initials and escaped names', async () => {
    vi.spyOn(catalogApi, 'getLeaderboard').mockResolvedValue([
      makeLeaderboardEntry({ rank: 1, playerName: 'Alex_Pro99', totalScore: 94_250 }),
      makeLeaderboardEntry({ rank: 2, playerName: '<b>Mia</b>' }),
    ]);
    mount();

    await vi.waitFor(() => expect(queryAll('.top-players tbody tr')).toHaveLength(2));
    const firstRow = queryAll('.top-players tbody tr')[0];
    expect(textOf(firstRow)).toContain('AP');
    expect(textOf(firstRow)).toContain('Alex_Pro99');
    expect(document.querySelector('.top-players tbody b')).toBeNull();
  });

  it('shows the empty and error states of the leaderboard', async () => {
    vi.spyOn(catalogApi, 'getLeaderboard').mockResolvedValueOnce([]).mockRejectedValueOnce(new HttpError('network'));
    mount();
    await vi.waitFor(() => expect(textOf(query('.top-players .empty-state__title'))).toBe('No players yet'));
    page.destroy();

    mount();
    await vi.waitFor(() => expect(document.querySelector('.top-players .error-banner')).not.toBeNull());
  });
});
