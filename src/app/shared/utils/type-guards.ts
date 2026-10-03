export type Guard<T> = (value: unknown) => value is T;

/**
 * One check per property of T. `-?` makes every key mandatory here, even optional ones:
 * add a field to the interface and forget it in the guard → compile error.
 */
export type Shape<T> = { readonly [K in keyof T]-?: (value: unknown) => boolean };

export function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

export function isBoolean(value: unknown): value is boolean {
  return typeof value === 'boolean';
}

export function isArrayOf<T>(itemGuard: Guard<T>): Guard<T[]> {
  return (value: unknown): value is T[] => Array.isArray(value) && value.every((item) => itemGuard(item));
}

export function isOptional<T>(guard: Guard<T>): Guard<T | undefined> {
  return (value: unknown): value is T | undefined => value === undefined || guard(value);
}

/** Extra properties are allowed: the backend may add fields without breaking the client */
export function hasShape<T>(shape: Shape<T>): Guard<T> {
  return (value: unknown): value is T => {
    if (!isRecord(value)) return false;

    for (const key in shape) {
      if (!shape[key](value[key])) return false;
    }

    return true;
  };
}
