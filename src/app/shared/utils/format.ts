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

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

const DAYS_IN_WEEK = 7;
const WEEKS_SHOWN = 3;
const DAYS_IN_MONTH = 30;
const MONTHS_SHOWN = 11;
const DAYS_IN_YEAR = 365;

function ago(count: number, unit: string): string {
  return `${count} ${unit}${count === 1 ? '' : 's'} ago`;
}

/**
 * 3-3-2 relative time, by ELAPSED time (not calendar days):
 *
 *   < 1 min → "just now"     1–59 min → "N min ago"      1–23 h → "N hour(s) ago"
 *   1–6 days → "N day(s)"    7–27 days → "1–3 weeks"      28–364 days → "1–11 months"     ≥ 365 days → "N year(s)"
 *
 * Weeks stop at 3 and months at 11, exactly as the task lists them: day 28 is already "1 month ago",
 * day 360 is still "11 months ago". A date in the future (clock skew) counts as "just now".
 * `now` is a parameter (default: the real clock) → deterministic unit tests in Story 4.
 */
export function formatRelativeTime(isoDate: string, now: Date = new Date()): string {
  const elapsed = now.getTime() - new Date(isoDate).getTime();

  if (Number.isNaN(elapsed) || elapsed < MINUTE_MS) return 'just now';
  if (elapsed < HOUR_MS) return `${Math.floor(elapsed / MINUTE_MS)} min ago`;
  if (elapsed < DAY_MS) return ago(Math.floor(elapsed / HOUR_MS), 'hour');

  const days = Math.floor(elapsed / DAY_MS);
  if (days < DAYS_IN_WEEK) return ago(days, 'day');
  if (days < DAYS_IN_WEEK * (WEEKS_SHOWN + 1)) return ago(Math.floor(days / DAYS_IN_WEEK), 'week');
  if (days < DAYS_IN_YEAR) return ago(Math.min(Math.max(1, Math.floor(days / DAYS_IN_MONTH)), MONTHS_SHOWN), 'month');
  return ago(Math.floor(days / DAYS_IN_YEAR), 'year');
}
