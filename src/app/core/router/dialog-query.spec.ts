import { describe, expect, it } from 'vitest';
import { parseAuthQueryValue, toAuthQueryValue } from './dialog-query';

describe('auth dialog query value', () => {
  it('maps the app modes to the URL values of the task', () => {
    expect(toAuthQueryValue('login')).toBe('login');
    expect(toAuthQueryValue('signup')).toBe('register');
  });

  it('parses the known values as valid', () => {
    expect(parseAuthQueryValue('login')).toEqual({ mode: 'login', isValid: true });
    expect(parseAuthQueryValue('register')).toEqual({ mode: 'signup', isValid: true });
  });

  it('opens the login tab for an unknown value but marks it invalid (so the URL gets corrected)', () => {
    expect(parseAuthQueryValue('signup')).toEqual({ mode: 'login', isValid: false });
    expect(parseAuthQueryValue('')).toEqual({ mode: 'login', isValid: false });
  });

  it('returns null when there is no auth key at all', () => {
    expect(parseAuthQueryValue(null)).toBeNull();
  });
});
