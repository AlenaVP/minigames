/** Current values of every field of a form, so a validator can compare fields (confirm password) */
export type FormValues<K extends string = string> = Readonly<Record<K, string>>;

/**
 * Returns an error message, or null when the value is valid — the role of Angular's ValidatorFn.
 * A field runs its validators in order and shows the FIRST message: one clear problem at a time.
 */
export type Validator<K extends string = string> = (value: string, values: FormValues<K>) => string | null;

export function required(message: string): Validator {
  return (value) => (value === '' ? message : null);
}

export function minLength(min: number, message: string): Validator {
  return (value) => (value.length < min ? message : null);
}

export function lengthBetween(min: number, max: number, message: string): Validator {
  return (value) => (value.length < min || value.length > max ? message : null);
}

/** The whole value must match: the pattern is anchored by the caller (^…$) */
export function pattern(regex: RegExp, message: string): Validator {
  return (value) => (regex.test(value) ? null : message);
}

/** Cross-field check: the value must equal another field's value exactly (no trimming, it's a password) */
export function matchesField<K extends string>(field: K, message: string): Validator<K> {
  return (value, values) => (value === values[field] ? null : message);
}
