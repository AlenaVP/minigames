const compactNumberFormat = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
  roundingMode: 'trunc',
});

export function formatCompactNumber(value: number): string {
  return compactNumberFormat.format(value);
}

export function formatRating(value: number): string {
  return value.toFixed(1);
}

const integerFormat = new Intl.NumberFormat('en');

/** 94250 → "94,250" */
export function formatInteger(value: number): string {
  return integerFormat.format(value);
}

export function formatScore(value: number): string {
  return `${formatInteger(value)} pts`;
}

// numeric: 'always' → "1 day ago" (as in Figma), not "yesterday"
const relativeTimeFormat = new Intl.RelativeTimeFormat('en', { numeric: 'always' });

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const DAYS_IN_WEEK = 7;
const DAYS_IN_MONTH = 30;
const DAYS_IN_YEAR = 365;

/** Whole calendar days between two moments, counted in UTC (the API sends ISO dates in UTC). */
function calendarDaysBetween(from: Date, to: Date): number {
  const fromDay = Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate());
  const toDay = Date.UTC(to.getUTCFullYear(), to.getUTCMonth(), to.getUTCDate());
  return Math.round((toDay - fromDay) / DAY_MS);
}

/**
 * "3 hours ago", "1 day ago", "2 weeks ago" …
 * Same calendar day → minutes/hours; otherwise calendar days, then weeks, months, years.
 * `now` is a parameter, not `new Date()` inside: tests (Story 4) and the Story 2 mock pass a fixed moment.
 */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const date = new Date(isoDate);
  const days = calendarDaysBetween(date, now);

  if (days === 0) {
    const elapsed = now.getTime() - date.getTime();
    if (elapsed < HOUR_MS) return relativeTimeFormat.format(-Math.max(1, Math.floor(elapsed / MINUTE_MS)), 'minute');
    return relativeTimeFormat.format(-Math.floor(elapsed / HOUR_MS), 'hour');
  }

  if (days < DAYS_IN_WEEK) return relativeTimeFormat.format(-days, 'day');
  if (days < DAYS_IN_MONTH) return relativeTimeFormat.format(-Math.floor(days / DAYS_IN_WEEK), 'week');
  if (days < DAYS_IN_YEAR) return relativeTimeFormat.format(-Math.floor(days / DAYS_IN_MONTH), 'month');
  return relativeTimeFormat.format(-Math.floor(days / DAYS_IN_YEAR), 'year');
}
