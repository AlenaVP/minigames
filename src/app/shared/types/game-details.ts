export interface GameSpecs {
  genre: string;
  players: string;
  duration: string;
  price: string;
}

export interface TopRecord {
  position: number;
  playerName: string;
  score: number;
  /** ISO 8601 date-time */
  achievedAt: string;
}

export interface GameDetails {
  slug: string;
  name: string;
  heroImage: string;
  rating: number;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  fullDescription: string;
  specs: GameSpecs;
  topRecords: readonly TopRecord[];
}

export interface GameComment {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  /** ISO 8601 date-time */
  createdAt: string;
}

export type CommentsSort = 'newest' | 'oldest';

export interface CommentsQuery {
  limit?: number;
  sort?: CommentsSort;
  /** Signed-in user: each comment's isLikedByCurrentUser is about them. A guest's request leaves it out */
  userEmail?: string;
}

export interface GameQuery {
  /** Signed-in user: isLikedByCurrentUser of the game = "this user has it in favorites" */
  userEmail?: string;
}

/** POST /games/{slug}/favorite — the state after the toggle, as the server sees it */
export interface FavoriteState {
  gameSlug: string;
  isFavorited: boolean;
  likesCount: number;
}

/** POST /comments/{commentId}/like — the comment's state after the toggle */
export interface CommentLikeState {
  isLikedByCurrentUser: boolean;
  likesCount: number;
}

/** POST /games/{slug}/comments body, apart from userEmail */
export interface NewComment {
  /** 2–30 characters */
  authorName: string;
  /** 1–500 characters after trimming */
  text: string;
}

/** The latest comments plus the total count for the "Comments (12)" heading */
export interface CommentsPage {
  comments: readonly GameComment[];
  /** Full count for the game, even when `limit` trims the list */
  total: number;
}
