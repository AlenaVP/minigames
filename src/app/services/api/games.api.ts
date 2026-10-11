import type { HttpClient } from '@app/core/http';
import type { GameSummary, GamesPage, GamesQuery } from '@shared/types/game';
import type {
  CommentLikeState,
  CommentsPage,
  CommentsQuery,
  FavoriteState,
  GameComment,
  GameDetails,
  GameQuery,
  NewComment,
} from '@shared/types/game-details';
import {
  isCommentLikeResponse,
  isCommentsResponse,
  isFavoriteResponse,
  isFeaturedGamesResponse,
  isGameDetailsResponse,
  isGamesPageResponse,
  isPostedCommentResponse,
} from './api.guards';

/**
 * Games, game details and their comments.
 * Reads are public; the mutations identify the user by `userEmail` only (no token) — whether one may be sent
 * at all is the client's session guard's decision, made before calling them.
 */
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

  /**
   * 404 → HttpError kind 'not-found' → "Game Not Found" state in the dialog.
   * With userEmail the answer is personal: isLikedByCurrentUser = this user has the game in favorites.
   */
  async getGame(slug: string, query: GameQuery = {}, signal?: AbortSignal): Promise<GameDetails> {
    const response = await this.http.get(`/games/${encodeURIComponent(slug)}`, {
      query: { userEmail: query.userEmail },
      guard: isGameDetailsResponse,
      signal,
    });
    return response.data;
  }

  async getComments(slug: string, query: CommentsQuery = {}, signal?: AbortSignal): Promise<CommentsPage> {
    const { data, meta } = await this.http.get(`/games/${encodeURIComponent(slug)}/comments`, {
      query: { limit: query.limit, sort: query.sort, userEmail: query.userEmail },
      guard: isCommentsResponse,
      signal,
    });

    return { comments: data, total: meta.totalComments };
  }

  /**
   * Toggle: the same POST adds and removes. A failure with an unknown outcome must not be repeated automatically —
   * a second toggle would undo the first (see getMutationOutcome).
   */
  async toggleFavorite(slug: string, userEmail: string, signal?: AbortSignal): Promise<FavoriteState> {
    const response = await this.http.post(
      `/games/${encodeURIComponent(slug)}/favorite`,
      { userEmail },
      { guard: isFavoriteResponse, signal },
    );
    return response.data;
  }

  /** 201 → the created comment. The list is then reloaded with GET (the POST has no total count) */
  async postComment(slug: string, userEmail: string, comment: NewComment, signal?: AbortSignal): Promise<GameComment> {
    const response = await this.http.post(
      `/games/${encodeURIComponent(slug)}/comments`,
      { userEmail, authorName: comment.authorName, text: comment.text },
      { guard: isPostedCommentResponse, signal },
    );
    return response.data;
  }

  /** Toggle, like toggleFavorite */
  async toggleCommentLike(commentId: string, userEmail: string, signal?: AbortSignal): Promise<CommentLikeState> {
    const response = await this.http.post(
      `/comments/${encodeURIComponent(commentId)}/like`,
      { userEmail },
      { guard: isCommentLikeResponse, signal },
    );
    return response.data;
  }
}
