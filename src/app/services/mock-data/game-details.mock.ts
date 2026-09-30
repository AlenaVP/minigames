import type { GameComment, GameDetails } from '@shared/types/game-details';

/**
 * "Current moment" of the mockup: relative dates of the mock records/comments
 * ("2 days ago", "3 hours ago") come out exactly as in Figma.
 * Story 3: real data → formatRelativeTime(date) with the real `new Date()`.
 */
export const MOCK_NOW = new Date('2026-08-30T10:00:00Z');

export const GAME_DETAILS_MOCK: GameDetails = {
  slug: 'tukoni-forest-keepers',
  name: 'Tukoni: Forest Keepers',
  heroImage: '/assets/images/games/tukoni-forest-keepers-hero.jpg',
  rating: 4.9,
  likesCount: 31_200,
  isLikedByCurrentUser: false,
  fullDescription:
    'Tukoni: Forest Keepers — a cozy hand-drawn puzzle-adventure. You are Traveller, a little forest spirit on an important mission. Wander storybook meadows, visit mushroom villages, meet adorable inhabitants, solve gentle hand-crafted puzzles, brew herbal teas and help the Tukoni forest prepare peacefully for the coming winter.',
  specs: {
    genre: 'Puzzle',
    players: 'Solo',
    duration: '40-90 min',
    price: 'Free',
  },
  topRecords: [
    { position: 1, playerName: 'ForestSpirit', score: 356_700, achievedAt: '2026-08-28T14:30:00Z' },
    { position: 2, playerName: 'TeaBrewer', score: 332_400, achievedAt: '2026-08-25T09:12:00Z' },
    { position: 3, playerName: 'HerbalistPath', score: 308_900, achievedAt: '2026-08-23T18:45:00Z' },
  ],
};

export const GAME_COMMENTS_MOCK: readonly GameComment[] = [
  {
    commentId: 'c5d9f2a1-7c3b-4e8f-9a0d-000000000001',
    authorName: 'ForestDweller',
    text: "The hand-drawn art is absolutely magical 🍄 Every location feels like a page from a children's storybook. The mushroom village made me cry happy tears!",
    likesCount: 12,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-30T07:00:00Z',
  },
  {
    commentId: 'c5d9f2a1-7c3b-4e8f-9a0d-000000000002',
    authorName: 'HerbalTeaLover',
    text: 'Perfect cozy evening game — brew a cup of chamomile, wrap in a blanket and help the little Tukoni prepare for winter. The puzzles are gentle but satisfying.',
    likesCount: 5,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-29T15:30:00Z',
  },
  {
    commentId: 'c5d9f2a1-7c3b-4e8f-9a0d-000000000003',
    authorName: 'CottageCoreMia',
    text: 'I want to live inside this game forever 🌿 The NPCs are so charming, the tea recipes are real, and the atmosphere is pure warmth and calm.',
    likesCount: 8,
    isLikedByCurrentUser: false,
    createdAt: '2026-08-27T20:10:00Z',
  },
];
