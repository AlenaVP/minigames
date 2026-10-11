import { describe, expect, it } from 'vitest';
import { FormModel } from './form-model';
import { matchesField, minLength, required } from './validators';

type Field = 'email' | 'password' | 'confirm';

function createModel(): FormModel<Field> {
  return new FormModel<Field>({
    email: { validators: [required('Email required')], normalize: (value) => value.trim() },
    password: { validators: [required('Password required'), minLength(6, 'Too short')] },
    confirm: { validators: [required('Confirm required'), matchesField('password', 'Mismatch')] },
  });
}

describe('FormModel', () => {
  it('starts invalid but shows no errors before the user interacts', () => {
    const model = createModel();

    expect(model.isValid).toBe(false);
    expect(model.getError('email')).toBe('Email required');
    expect(model.getVisibleError('email')).toBeNull();
  });

  it('shows an error as soon as the user types into a field', () => {
    const model = createModel();

    model.setValue('password', 'abc');

    expect(model.getVisibleError('password')).toBe('Too short');
    expect(model.getVisibleError('email')).toBeNull();
  });

  it('shows "required" when the user leaves an empty field', () => {
    const model = createModel();

    model.markTouched('email');

    expect(model.getVisibleError('email')).toBe('Email required');
  });

  it('clears the error once the value becomes valid', () => {
    const model = createModel();

    model.setValue('password', 'abc');
    model.setValue('password', 'abcdef');

    expect(model.getVisibleError('password')).toBeNull();
  });

  it('re-checks the confirmation whenever the password changes', () => {
    const model = createModel();
    model.setValue('password', 'secret1');
    model.setValue('confirm', 'secret1');
    expect(model.getVisibleError('confirm')).toBeNull();

    model.setValue('password', 'secret12');

    expect(model.getVisibleError('confirm')).toBe('Mismatch');
  });

  it('is valid only when every field passes', () => {
    const model = createModel();
    model.setValue('email', 'a@b.co');
    model.setValue('password', 'secret1');
    expect(model.isValid).toBe(false);

    model.setValue('confirm', 'secret1');
    expect(model.isValid).toBe(true);
  });

  it('validates and returns normalized values (trimmed email)', () => {
    const model = createModel();
    model.setValue('email', '  a@b.co  ');

    expect(model.values().email).toBe('a@b.co');
  });

  it('a value of spaces only is still "required" after normalization', () => {
    const model = createModel();
    model.setValue('email', ' '.repeat(3));

    expect(model.getVisibleError('email')).toBe('Email required');
  });

  it('markAllTouched reveals every remaining problem', () => {
    const model = createModel();
    model.markAllTouched();

    expect(model.fieldNames.map((name) => model.getVisibleError(name))).toEqual([
      'Email required',
      'Password required',
      'Confirm required',
    ]);
  });

  it('reset() empties the values and hides the errors again', () => {
    const model = createModel();
    model.setValue('password', 'abc');
    model.markAllTouched();

    model.reset();

    expect(model.values()).toEqual({ email: '', password: '', confirm: '' });
    expect(model.getVisibleError('password')).toBeNull();
  });

  it('has() tells the form fields from foreign inputs', () => {
    const model = createModel();
    expect(model.has('email')).toBe(true);
    expect(model.has('search')).toBe(false);
  });
});
