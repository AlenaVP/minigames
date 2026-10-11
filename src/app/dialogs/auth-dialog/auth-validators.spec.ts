import { describe, expect, it } from 'vitest';
import type { FormValues, Validator } from '@shared/forms/validators';
import {
  MESSAGES,
  confirmPasswordValidators,
  emailValidators,
  loginPasswordValidators,
  registerPasswordValidators,
  usernameValidators,
} from './auth-validators';

/** What a field shows: the first failing rule, or null */
function firstError(validators: readonly Validator[], value: string, values: FormValues = {}): string | null {
  for (const validator of validators) {
    const message = validator(value, values);
    if (message !== null) return message;
  }
  return null;
}

describe('email', () => {
  it.each(['alex@minigames.com', 'a.b+tag@sub.domain.co', 'A_B@X.IO', "o'neil@mail.org"])('accepts %s', (email) => {
    expect(firstError(emailValidators, email)).toBeNull();
  });

  it.each(['alex', 'a@b', 'a@b.c', 'a..b@x.com', '.a@x.com', 'a.@x.com', 'a b@x.com', 'a@-x.com', 'a@x..com'])(
    'rejects %s',
    (email) => {
      expect(firstError(emailValidators, email)).toBe(MESSAGES.emailInvalid);
    },
  );

  it('requires a value', () => {
    expect(firstError(emailValidators, '')).toBe(MESSAGES.emailRequired);
  });
});

describe('username', () => {
  it.each(['Al', 'CozyGamer99', `A${'b'.repeat(29)}`])('accepts %s', (username) => {
    expect(firstError(usernameValidators, username)).toBeNull();
  });

  it.each([
    ['', MESSAGES.usernameRequired],
    ['CozyGamer_99', MESSAGES.usernameCharacters],
    ['Cozy Gamer', MESSAGES.usernameCharacters],
    ['Żaneta', MESSAGES.usernameCharacters],
    ['cozyGamer', MESSAGES.usernameFirstLetter],
    ['9Lives', MESSAGES.usernameFirstLetter],
    ['A', MESSAGES.usernameLength],
    [`A${'b'.repeat(30)}`, MESSAGES.usernameLength],
  ])('"%s" → %s', (username, message) => {
    expect(firstError(usernameValidators, username)).toBe(message);
  });
});

describe('registration password', () => {
  it.each(['Abc12!', 'P@ssw0rd', 'Zz9~zz', String.raw`A1"\[]^_`])('accepts %s', (password) => {
    expect(firstError(registerPasswordValidators, password)).toBeNull();
  });

  it.each([
    ['', MESSAGES.passwordRequired],
    ['Abc 12!', MESSAGES.passwordCharacters],
    ['Ąbc12!x', MESSAGES.passwordCharacters],
    ['Ab1!', MESSAGES.passwordLength],
    ['abcdef', 'Password needs an uppercase letter, a digit and a special character (e.g. !@#$)'],
    ['Abcdef!', 'Password needs a digit'],
    ['abc12!', 'Password needs an uppercase letter'],
    ['Abc123', 'Password needs a special character (e.g. !@#$)'],
    ['abcde1', 'Password needs an uppercase letter and a special character (e.g. !@#$)'],
  ])('"%s" → %s', (password, message) => {
    expect(firstError(registerPasswordValidators, password)).toBe(message);
  });
});

describe('login password', () => {
  it('checks presence and length only, not the registration strength rules', () => {
    expect(firstError(loginPasswordValidators, '')).toBe(MESSAGES.passwordRequired);
    expect(firstError(loginPasswordValidators, 'abcde')).toBe(MESSAGES.passwordLength);
    expect(firstError(loginPasswordValidators, 'abcdef')).toBeNull();
  });
});

describe('confirm password', () => {
  const validators = confirmPasswordValidators('password');

  it('only has to match — even a weak password is a valid confirmation of itself', () => {
    expect(firstError(validators, 'abc', { password: 'abc' })).toBeNull();
  });

  it('reports a mismatch and an empty value', () => {
    expect(firstError(validators, 'Abc12!', { password: 'Abc12?' })).toBe(MESSAGES.confirmMismatch);
    expect(firstError(validators, '', { password: 'Abc12!' })).toBe(MESSAGES.confirmRequired);
  });
});
