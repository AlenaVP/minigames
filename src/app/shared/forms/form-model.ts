import type { FormValues, Validator } from './validators';

export interface FieldDefinition<K extends string> {
  validators: readonly Validator<K>[];
  /** Applied before validation and in values(): e.g. trim an email, never a password */
  normalize?: (value: string) => string;
}

export type FormDefinition<K extends string> = Readonly<Record<K, FieldDefinition<K>>>;

interface FieldState {
  raw: string;
  /** The user typed into the field at least once */
  dirty: boolean;
  /** The user left the field at least once */
  touched: boolean;
}

/**
 * Form state without DOM — a tiny version of Angular's FormGroup:
 *
 *   setValue('email', 'a')  → dirty, error "Please enter a valid email…" is visible at once
 *   markTouched('email')    → leaving an empty field shows "Enter your email address"
 *   isValid                 → every field of the form passes its validators (drives the submit button)
 *
 * Errors are not stored but computed from the current values, so a cross-field rule
 * (confirm password) is re-checked automatically whenever the password changes.
 */
export class FormModel<K extends string> {
  private readonly definition: FormDefinition<K>;
  private readonly names: readonly K[];
  private state: Record<K, FieldState>;

  constructor(definition: FormDefinition<K>) {
    this.definition = definition;
    this.names = Object.keys(definition) as K[];
    this.state = this.createInitialState();
  }

  get fieldNames(): readonly K[] {
    return this.names;
  }

  get isValid(): boolean {
    return this.names.every((name) => this.getError(name) === null);
  }

  has(name: string): name is K {
    return (this.names as readonly string[]).includes(name);
  }

  setValue(name: K, raw: string): void {
    this.state[name] = { ...this.state[name], raw, dirty: true };
  }

  markTouched(name: K): void {
    this.state[name] = { ...this.state[name], touched: true };
  }

  /** E.g. on a submit attempt: every problem becomes visible */
  markAllTouched(): void {
    for (const name of this.names) this.markTouched(name);
  }

  /** The current validation error, visible or not */
  getError(name: K): string | null {
    const values = this.values();
    const value = values[name];

    for (const validator of this.definition[name].validators) {
      const message = validator(value, values);
      if (message !== null) return message;
    }

    return null;
  }

  /** What the UI shows: nothing until the user has typed into the field or left it */
  getVisibleError(name: K): string | null {
    const { dirty, touched } = this.state[name];
    return dirty || touched ? this.getError(name) : null;
  }

  /** Normalized values — what gets validated and later submitted */
  values(): FormValues<K> {
    const entries = this.names.map((name) => {
      const normalize = this.definition[name].normalize ?? ((value: string) => value);
      return [name, normalize(this.state[name].raw)];
    });
    return Object.fromEntries(entries) as FormValues<K>;
  }

  reset(): void {
    this.state = this.createInitialState();
  }

  private createInitialState(): Record<K, FieldState> {
    const entries = this.names.map((name) => [name, { raw: '', dirty: false, touched: false }]);
    return Object.fromEntries(entries) as Record<K, FieldState>;
  }
}
