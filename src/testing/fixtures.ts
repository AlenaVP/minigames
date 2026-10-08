import type { Category, GameSummary } from '@shared/types/game';
import type { GameComment, GameDetails } from '@shared/types/game-details';
import type { LeaderboardEntry } from '@shared/types/leaderboard';

// Valid API entities shaped like tasks/mock-data of the course; override only what a test cares about.

export function makeCategory(overrides: Partial<Category> = {}): Category {
  return { slug: 'puzzle', label: 'Puzzle', isDefault: false, ...overrides };
}

export function makeGameSummary(overrides: Partial<GameSummary> = {}): GameSummary {
  return {
    slug: 'tiny-glade',
    name: 'Tiny Glade',
    category: 'puzzle',
    price: '$14.99',
    shortDescription: 'Build cozy castles.',
    rating: 4.8,
    likesCount: 1200,
    cardImage: '/images/tiny-glade-card.jpg',
    ...overrides,
  };
}

export function makeGameDetails(overrides: Partial<GameDetails> = {}): GameDetails {
  return {
    slug: 'tiny-glade',
    name: 'Tiny Glade',
    heroImage: '/images/tiny-glade-hero.jpg',
    rating: 4.8,
    likesCount: 1200,
    isLikedByCurrentUser: false,
    fullDescription: 'A small diorama builder.',
    specs: { genre: 'Puzzle', players: '1', duration: '15 min', price: '$14.99' },
    topRecords: [{ position: 1, playerName: 'CozyGamer', score: 94_250, achievedAt: '2026-09-01T10:00:00.000Z' }],
    ...overrides,
  };
}

export function makeComment(overrides: Partial<GameComment> = {}): GameComment {
  return {
    commentId: 'c-1',
    authorName: 'CozyGamer',
    text: 'Love it!',
    likesCount: 3,
    isLikedByCurrentUser: false,
    createdAt: '2026-10-01T12:00:00.000Z',
    ...overrides,
  };
}

export function makeLeaderboardEntry(overrides: Partial<LeaderboardEntry> = {}): LeaderboardEntry {
  return {
    rank: 1,
    playerName: 'MatchMaster',
    gamesPlayed: 42,
    totalScore: 94_250,
    streakDays: 7,
    favoriteGameSlug: 'tiny-glade',
    favoriteGameName: 'Tiny Glade',
    ...overrides,
  };
}
