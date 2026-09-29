import type { GameSummary } from '@shared/types/game';

// First 6 entries of tasks/mock-data/all-games-seed.json — the same order as the desktop mockup.
// Story 3: replaced by GET /games?page=&category=&sort=
export const LIBRARY_GAMES_MOCK: readonly GameSummary[] = [
  {
    slug: 'vacation-cafe-simulator',
    name: 'Vacation Cafe Simulator',
    category: 'strategy',
    price: 'Free',
    shortDescription:
      'Cozy Italian Vacation Cafe 🏖️ No timers, No stress 😌 cook traditional dishes 🍝 upgrade and customize 🏠 just drink Prosecco 🥂 relax and grow your dream cafe ✨',
    rating: 4.8,
    likesCount: 28_750,
    cardImage: '/assets/images/games/vacation-cafe-simulator-card.jpg',
    featured: true,
  },
  {
    slug: 'winter-burrow',
    name: 'Winter Burrow',
    category: 'farm',
    price: 'Free',
    shortDescription:
      'A cozy woodland survival game about a mouse restoring their childhood burrow. Explore, gather resources, craft, knit warm sweaters, bake pies and meet the locals.',
    rating: 4.9,
    likesCount: 32_400,
    cardImage: '/assets/images/games/winter-burrow-card.jpg',
    featured: true,
  },
  {
    slug: 'shelve-the-potions',
    name: 'Shelve the Potions!',
    category: 'puzzle',
    price: 'Free',
    shortDescription:
      "Organize 2000+ potions on shelves after the witch's cats have knocked them over, using clues around an enchanted cellar. Learn strange symbols and decipher cryptic notes.",
    rating: 4.7,
    likesCount: 21_300,
    cardImage: '/assets/images/games/shelve-the-potions-card.jpg',
    featured: true,
  },
  {
    slug: 'heartopia',
    name: 'Heartopia',
    category: 'strategy',
    price: '$1.99',
    shortDescription:
      'A multiplayer life simulation game crafted for creativity, freedom, and peace. Build your dream home, explore hobbies, and forge warm connections with friends in a cozy town.',
    rating: 4.6,
    likesCount: 46_800,
    cardImage: '/assets/images/games/heartopia-card.jpg',
    featured: true,
  },
  {
    slug: 'palia',
    name: 'Palia',
    category: 'strategy',
    price: 'Free',
    shortDescription:
      'A free-to-play fantasy life sim adventure where you can craft, explore, and create the life and home of your dreams in a vibrant, heartwarming world.',
    rating: 4.8,
    likesCount: 89_500,
    cardImage: '/assets/images/games/palia-card.jpg',
    featured: true,
  },
  {
    slug: 'cat-mail-co',
    name: 'Cat Mail Co.',
    category: 'puzzle',
    price: 'Free',
    shortDescription:
      'Run a cozy cat post office. Sort and deliver parcels from the daily boat. At night, the moon reveals hidden truths about packages. Clear a strange backlog and unlock new destinations.',
    rating: 4.9,
    likesCount: 38_200,
    cardImage: '/assets/images/games/cat-mail-co-card.jpg',
    featured: true,
  },
];
