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
}

/** The latest comments plus the total count for the "Comments (12)" heading */
export interface CommentsPage {
  comments: readonly GameComment[];
  /** Full count for the game, even when `limit` trims the list */
  total: number;
}
