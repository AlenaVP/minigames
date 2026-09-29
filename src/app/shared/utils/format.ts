// 'trunc' instead of the default half-expand rounding: 28 750 → "28.7K" as in Figma (not "28.8K")
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
