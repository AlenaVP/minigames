// Vite resolves every matching file at build time and gives back its final (hashed, base-aware) URL.
// Paths from the mock JSON ("/assets/images/…") can't be used directly: they ignore base "/minigames/".
const cardCovers = import.meta.glob<string>('@assets/images/games/*-card.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const heroImages = import.meta.glob<string>('@assets/images/games/*-hero.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
});

// '/src/assets/images/games/palia-card.jpg' → 'palia'
function mapBySlug(files: Record<string, string>, suffix: string): Map<string, string> {
  return new Map(Object.entries(files).map(([path, url]) => [path.split('/').at(-1)?.replace(suffix, '') ?? path, url]));
}

const coverBySlug = mapBySlug(cardCovers, '-card.jpg');
const heroBySlug = mapBySlug(heroImages, '-hero.jpg');

export function getCardCoverUrl(slug: string): string | undefined {
  return coverBySlug.get(slug);
}

export function getHeroImageUrl(slug: string): string | undefined {
  return heroBySlug.get(slug);
}
