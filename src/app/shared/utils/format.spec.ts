import { describe, expect, it } from 'vitest';
import { formatCompactNumber, formatInteger, formatRating, formatRelativeTime, formatScore } from './format';

describe('formatCompactNumber', () => {
  it.each([
    [999, '999'],
    [1200, '1.2K'],
    // truncated, not rounded: 1.99K must not become "2K"
    [1999, '1.9K'],
    [2_500_000, '2.5M'],
  ])('%d → %s', (value, expected) => {
    expect(formatCompactNumber(value)).toBe(expected);
  });
});

describe('formatInteger / formatScore / formatRating', () => {
  it('groups thousands with commas', () => {
    expect(formatInteger(94_250)).toBe('94,250');
  });

  it('adds the "pts" unit to a score', () => {
    expect(formatScore(1_234_567)).toBe('1,234,567 pts');
  });

  it('always shows one decimal in a rating', () => {
    expect(formatRating(4)).toBe('4.0');
    expect(formatRating(4.86)).toBe('4.9');
  });
});

describe('formatRelativeTime', () => {
  const now = new Date('2026-10-08T12:00:00.000Z');
  const minutesAgo = (minutes: number): string => new Date(now.getTime() - minutes * 60_000).toISOString();
  const daysAgo = (days: number): string => minutesAgo(days * 24 * 60);

  it.each([
    ['30 seconds', minutesAgo(0.5), 'just now'],
    ['1 minute', minutesAgo(1), '1 min ago'],
    ['59 minutes', minutesAgo(59), '59 min ago'],
    ['1 hour', minutesAgo(60), '1 hour ago'],
    ['23 hours', minutesAgo(23 * 60), '23 hours ago'],
    ['1 day', daysAgo(1), '1 day ago'],
    ['6 days', daysAgo(6), '6 days ago'],
    ['7 days', daysAgo(7), '1 week ago'],
    ['27 days', daysAgo(27), '3 weeks ago'],
    ['28 days', daysAgo(28), '1 month ago'],
    ['60 days', daysAgo(60), '2 months ago'],
    ['364 days', daysAgo(364), '11 months ago'],
    ['365 days', daysAgo(365), '1 year ago'],
    ['3 years', daysAgo(3 * 365), '3 years ago'],
  ])('%s → %s', (_label, iso, expected) => {
    expect(formatRelativeTime(iso, now)).toBe(expected);
  });

  it('treats a date in the future (clock skew) as "just now"', () => {
    expect(formatRelativeTime(minutesAgo(-10), now)).toBe('just now');
  });

  it('treats an unparsable date as "just now" instead of "NaN …"', () => {
    expect(formatRelativeTime('not a date', now)).toBe('just now');
  });
});
