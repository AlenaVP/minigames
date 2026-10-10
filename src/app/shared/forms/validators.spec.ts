import { describe, expect, it } from 'vitest';
import { lengthBetween, matchesField, minLength, pattern, required } from './validators';

const noValues = {};

describe('generic validators', () => {
  it('required rejects only an empty value', () => {
    const validate = required('Required');
    expect(validate('', noValues)).toBe('Required');
    expect(validate(' ', noValues)).toBeNull();
    expect(validate('a', noValues)).toBeNull();
  });

  it('minLength counts characters', () => {
    const validate = minLength(3, 'Too short');
    expect(validate('ab', noValues)).toBe('Too short');
    expect(validate('abc', noValues)).toBeNull();
  });

  it('lengthBetween includes both limits', () => {
    const validate = lengthBetween(2, 4, 'Wrong length');
    expect(validate('a', noValues)).toBe('Wrong length');
    expect(validate('ab', noValues)).toBeNull();
    expect(validate('abcd', noValues)).toBeNull();
    expect(validate('abcde', noValues)).toBe('Wrong length');
  });

  it('pattern returns the message when the value does not match', () => {
    const validate = pattern(/^\d+$/, 'Digits only');
    expect(validate('12a', noValues)).toBe('Digits only');
    expect(validate('123', noValues)).toBeNull();
  });

  it('matchesField compares with another field exactly, without trimming', () => {
    const validate = matchesField('password', 'Mismatch');
    expect(validate('Secret1!', { password: 'Secret1!' })).toBeNull();
    expect(validate('Secret1! ', { password: 'Secret1!' })).toBe('Mismatch');
    expect(validate('secret1!', { password: 'Secret1!' })).toBe('Mismatch');
  });
});
