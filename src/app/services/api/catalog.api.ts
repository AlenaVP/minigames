import type { HttpClient } from '@app/core/http';
import type { Category } from '@shared/types/game';
import type { LeaderboardEntry } from '@shared/types/leaderboard';
import { isCategoriesResponse, isLeaderboardResponse } from './api.guards';

/** Reference data for the Library filter and the Home leaderboard */
export class CatalogApi {
  private readonly http: HttpClient;
  private categoriesRequest: Promise<readonly Category[]> | null = null;

  constructor(http: HttpClient) {
    this.http = http;
  }

  /**
   * Requested once per session and shared by every caller — like shareReplay(1).
   * No `signal` on purpose: one caller leaving must not cancel the request others are waiting for.
   * A failed request is not cached, so Retry asks the server again.
   */
  getCategories(): Promise<readonly Category[]> {
    if (this.categoriesRequest) return this.categoriesRequest;

    const request = this.http.get('/categories', { guard: isCategoriesResponse }).then((response) => response.data);

    this.categoriesRequest = request;
    request.catch(() => {
      if (this.categoriesRequest === request) this.categoriesRequest = null;
    });

    return request;
  }

  async getLeaderboard(signal?: AbortSignal): Promise<readonly LeaderboardEntry[]> {
    const response = await this.http.get('/leaderboard', { guard: isLeaderboardResponse, signal });
    return response.data;
  }
}
