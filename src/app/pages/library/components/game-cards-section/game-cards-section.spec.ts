// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { query, queryAll, textOf } from '@testing/dom';
import { makeCategory, makeGameSummary } from '@testing/fixtures';
import { GameCardsSection, renderGameCardsSkeleton } from '.';

describe('GameCardsSection', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('renders one card per game with the category label, price, rating and likes', () => {
    new GameCardsSection({
      games: [
        makeGameSummary({ slug: 'tiny-glade', name: 'Tiny Glade', category: 'puzzle', price: '$14.99' }),
        makeGameSummary({ slug: 'heartopia', name: 'Heartopia', category: 'farm', price: 'Free', likesCount: 28_750 }),
      ],
      categories: [makeCategory({ slug: 'puzzle', label: 'Puzzle' })],
      onDetailsClick: vi.fn(),
    }).mount(document.body);

    const cards = queryAll('.library-card');
    expect(cards).toHaveLength(2);
    expect(textOf(query('.library-card__category', cards[0]))).toBe('Puzzle');
    // A category the list does not know is shown by its slug rather than left empty
    expect(textOf(query('.library-card__category', cards[1]))).toBe('farm');
    expect(query('.library-card__price', cards[1]).classList.contains('library-card__price--free')).toBe(true);
    expect(textOf(query('.library-card__stats', cards[1]))).toContain('28.7K');
  });

  it('names each card by its title and each Details button by its game', () => {
    new GameCardsSection({
      games: [makeGameSummary({ name: 'Tiny Glade' })],
      categories: [],
      onDetailsClick: vi.fn(),
    }).mount(document.body);

    const article = query('.library-card__inner');
    expect(query(`#${article.getAttribute('aria-labelledby') ?? ''}`).textContent).toBe('Tiny Glade');
    expect(textOf(query('.library-card__details'))).toBe('Details: Tiny Glade');
  });

  it('escapes the API text', () => {
    new GameCardsSection({
      games: [makeGameSummary({ name: '<img src=x>', shortDescription: '<script>bad()</script>' })],
      categories: [],
      onDetailsClick: vi.fn(),
    }).mount(document.body);

    expect(document.querySelector('.library-card script, .library-card__title img')).toBeNull();
    expect(textOf(query('.library-card__title'))).toBe('<img src=x>');
  });

  it('opens the details of the clicked game', () => {
    const onDetailsClick = vi.fn();
    new GameCardsSection({
      games: [makeGameSummary({ slug: 'a' }), makeGameSummary({ slug: 'b' })],
      categories: [],
      onDetailsClick,
    }).mount(document.body);

    queryAll('.library-card__details')[1].click();

    expect(onDetailsClick).toHaveBeenCalledWith('b');
  });

  it('builds the skeleton with as many placeholder cards as asked', () => {
    expect(renderGameCardsSkeleton(6).querySelectorAll('.library-card--skeleton')).toHaveLength(6);
  });
});
