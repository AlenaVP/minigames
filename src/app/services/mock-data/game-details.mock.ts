import type { GameDetails } from '@shared/types/game-details';

// tasks/mock-data/game-tukoni-forest-keepers.json.
// Story 2: the dialog always shows this game (Common Game Details Content Requirements).
// Story 3: replaced by GET /games/:slug
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
