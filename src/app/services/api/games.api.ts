import type { HttpClient } from '@app/core/http';
import type { GameSummary, GamesPage, GamesQuery } from '@shared/types/game';
import type { CommentsPage, CommentsQuery, GameDetails } from '@shared/types/game-details';
import { isCommentsResponse, isFeaturedGamesResponse, isGameDetailsResponse, isGamesPageResponse } from './api.guards';

/** Games, game details and their comments (public read endpoints) */
export class GamesApi {
  private readonly http: HttpClient;

  /** The client is passed in (not imported) — in Story 4 tests get a fake one, like Angular DI */
  constructor(http: HttpClient) {
    this.http = http;
  }

  /** Home slider: the backend returns all featured games and ignores page/category/sort */
  async getFeatured(signal?: AbortSignal): Promise<readonly GameSummary[]> {
    const response = await this.http.get('/games', { query: { featured: true }, guard: isFeaturedGamesResponse, signal });
    return response.data;
  }

  /** Library: filtering, sorting and pagination happen on the server */
  async getGames(query: GamesQuery, signal?: AbortSignal): Promise<GamesPage> {
    const { data, meta } = await this.http.get('/games', {
      query: { category: query.category, sort: query.sort, page: query.page, limit: query.limit },
      guard: isGamesPageResponse,
      signal,
    });

    return { games: data, page: meta.page, totalPages: meta.totalPages, totalItems: meta.totalItems };
  }

  /** 404 → HttpError kind 'not-found' → "Game Not Found" state in the dialog */
  async getGame(slug: string, signal?: AbortSignal): Promise<GameDetails> {
    const response = await this.http.get(`/games/${encodeURIComponent(slug)}`, { guard: isGameDetailsResponse, signal });
    return response.data;
  }

  async getComments(slug: string, query: CommentsQuery = {}, signal?: AbortSignal): Promise<CommentsPage> {
    const { data, meta } = await this.http.get(`/games/${encodeURIComponent(slug)}/comments`, {
      query: { limit: query.limit, sort: query.sort },
      guard: isCommentsResponse,
      signal,
    });

    return { comments: data, total: meta.totalComments };
  }
}
