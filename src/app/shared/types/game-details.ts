// Same shape as tasks/mock-data/game-tukoni-forest-keepers.json → data

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

// Same shape as tasks/mock-data/comments-tukoni-forest-keepers.json → data[]
export interface GameComment {
  commentId: string;
  authorName: string;
  text: string;
  likesCount: number;
  isLikedByCurrentUser: boolean;
  /** ISO 8601 date-time */
  createdAt: string;
}
