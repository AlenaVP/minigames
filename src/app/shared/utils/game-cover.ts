// Vite resolves every matching file at build time and gives back its final (hashed, base-aware) URL.
// Paths from the mock JSON ("/assets/images/…") can't be used directly: they ignore base "/minigames/".
const cardCovers = import.meta.glob<string>('@assets/images/games/*-card.jpg', {
  eager: true,
  query: '?url',
  import: 'default',
});

const coverBySlug = new Map(
  Object.entries(cardCovers).map(([path, url]) => [path.split('/').at(-1)?.replace('-card.jpg', '') ?? path, url]),
);

export function getCardCoverUrl(slug: string): string | undefined {
  return coverBySlug.get(slug);
}
