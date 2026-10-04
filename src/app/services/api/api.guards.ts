import type { ApiListResponse, ApiResponse, CommentsMeta, PaginationMeta } from '@shared/types/api';
import type { Category, GameSummary } from '@shared/types/game';
import type { GameComment, GameDetails, GameSpecs, TopRecord } from '@shared/types/game-details';
import type { LeaderboardEntry } from '@shared/types/leaderboard';
import { type Guard, hasShape, isArrayOf, isBoolean, isNumber, isRecord, isString } from '@shared/utils/type-guards';

// ---- response wrappers ----

function isApiResponse<T>(dataGuard: Guard<T>): Guard<ApiResponse<T>> {
  return hasShape<ApiResponse<T>>({ data: dataGuard });
}

function isApiListResponse<T, M>(itemGuard: Guard<T>, metaGuard: Guard<M>): Guard<ApiListResponse<T, M>> {
  return hasShape<ApiListResponse<T, M>>({ data: isArrayOf(itemGuard), meta: metaGuard });
}

// ---- entities ----

const isCategory = hasShape<Category>({ slug: isString, label: isString, isDefault: isBoolean });

const isGameSummary = hasShape<GameSummary>({
  slug: isString,
  name: isString,
  category: isString,
  price: isString,
  shortDescription: isString,
  rating: isNumber,
  likesCount: isNumber,
  cardImage: isString,
});

const isGameSpecs = hasShape<GameSpecs>({ genre: isString, players: isString, duration: isString, price: isString });

const isTopRecord = hasShape<TopRecord>({ position: isNumber, playerName: isString, score: isNumber, achievedAt: isString });

const isGameDetails = hasShape<GameDetails>({
  slug: isString,
  name: isString,
  heroImage: isString,
  rating: isNumber,
  likesCount: isNumber,
  isLikedByCurrentUser: isBoolean,
  fullDescription: isString,
  specs: isGameSpecs,
  topRecords: isArrayOf(isTopRecord),
});

const isGameComment = hasShape<GameComment>({
  commentId: isString,
  authorName: isString,
  text: isString,
  likesCount: isNumber,
  isLikedByCurrentUser: isBoolean,
  createdAt: isString,
});

const isLeaderboardEntry = hasShape<LeaderboardEntry>({
  rank: isNumber,
  playerName: isString,
  gamesPlayed: isNumber,
  totalScore: isNumber,
  streakDays: isNumber,
  favoriteGameSlug: isString,
  favoriteGameName: isString,
});

// ---- meta ----

const isPaginationMeta = hasShape<PaginationMeta>({
  page: isNumber,
  limit: isNumber,
  totalItems: isNumber,
  totalPages: isNumber,
});

const isCommentsMeta = hasShape<CommentsMeta>({ totalComments: isNumber, returnedCount: isNumber });

// ---- endpoints ----

/** GET /categories, /leaderboard, /games?featured=true: the UI doesn't read their meta */
export const isCategoriesResponse = isApiListResponse(isCategory, isRecord);
export const isLeaderboardResponse = isApiListResponse(isLeaderboardEntry, isRecord);
export const isFeaturedGamesResponse = isApiListResponse(isGameSummary, isRecord);

export const isGamesPageResponse = isApiListResponse(isGameSummary, isPaginationMeta);
export const isGameDetailsResponse = isApiResponse(isGameDetails);
export const isCommentsResponse = isApiListResponse(isGameComment, isCommentsMeta);
