import { type Validator, lengthBetween, matchesField, minLength, pattern, required } from '@shared/forms/validators';

/**
 * Field rules of RSS-QS-4-1-1. "English letters" = A–Z / a–z only;
 * "special character" = any printable ASCII symbol that is not a letter, digit or space: !"#$%&'()*+,-./:;<=>?@[\]^_`{|}~
 */
export const PASSWORD_MIN_LENGTH = 6;
export const USERNAME_MIN_LENGTH = 2;
export const USERNAME_MAX_LENGTH = 30;

/**
 * A practical "standard email": local part without leading/trailing/double dots, @, a domain with at least
 * one dot and a letter TLD (a@b and a@b.c are rejected — Firebase would reject them too).
 */
const EMAIL_PATTERN = /^(?!\.)(?!.*\.\.)[\w.!#$%&'*+/=?^`{|}~-]+(?<!\.)@(?:[a-z\d](?:[a-z\d-]{0,61}[a-z\d])?\.)+[a-z]{2,}$/i;

/** ASCII punctuation as three ranges: ! … /   : … @   [ … `   { … ~ */
const SPECIAL_CHARACTER = /[!-/:-@[-`{-~]/;
const PASSWORD_ALLOWED = /^[A-Za-z\d!-/:-@[-`{-~]+$/;

export const MESSAGES = {
  emailRequired: 'Enter your email address',
  emailInvalid: 'Please enter a valid email address',
  usernameRequired: 'Enter a username',
  usernameCharacters: 'Use English letters and digits only',
  usernameFirstLetter: 'Username must start with an uppercase English letter',
  usernameLength: `Username must be ${USERNAME_MIN_LENGTH}–${USERNAME_MAX_LENGTH} characters long`,
  passwordRequired: 'Enter a password',
  passwordCharacters: 'Use English letters, digits and special characters only (no spaces)',
  passwordLength: `Password must be at least ${PASSWORD_MIN_LENGTH} characters long`,
  confirmRequired: 'Repeat your password',
  confirmMismatch: 'Passwords do not match',
} as const;

/** "a, b and c" */
function joinWithAnd(items: readonly string[]): string {
  if (items.length <= 1) return items.join('');
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

/** Names only what is still missing: "Password needs an uppercase letter and a digit" */
export const passwordStrength: Validator = (value) => {
  const missing = [
    /[A-Z]/.test(value) ? null : 'an uppercase letter',
    /\d/.test(value) ? null : 'a digit',
    SPECIAL_CHARACTER.test(value) ? null : 'a special character (e.g. !@#$)',
  ].filter((item) => item !== null);

  return missing.length > 0 ? `Password needs ${joinWithAnd(missing)}` : null;
};

export const emailValidators: readonly Validator[] = [
  required(MESSAGES.emailRequired),
  pattern(EMAIL_PATTERN, MESSAGES.emailInvalid),
];

export const usernameValidators: readonly Validator[] = [
  required(MESSAGES.usernameRequired),
  pattern(/^[A-Za-z\d]+$/, MESSAGES.usernameCharacters),
  pattern(/^[A-Z]/, MESSAGES.usernameFirstLetter),
  lengthBetween(USERNAME_MIN_LENGTH, USERNAME_MAX_LENGTH, MESSAGES.usernameLength),
];

/** Login checks presence and length only — the strength rules belong to registration */
export const loginPasswordValidators: readonly Validator[] = [
  required(MESSAGES.passwordRequired),
  minLength(PASSWORD_MIN_LENGTH, MESSAGES.passwordLength),
];

export const registerPasswordValidators: readonly Validator[] = [
  required(MESSAGES.passwordRequired),
  pattern(PASSWORD_ALLOWED, MESSAGES.passwordCharacters),
  minLength(PASSWORD_MIN_LENGTH, MESSAGES.passwordLength),
  passwordStrength,
];

/** Only the match is checked: the password rules are not applied to this field a second time */
export function confirmPasswordValidators<K extends string>(passwordField: K): readonly Validator<K>[] {
  return [required(MESSAGES.confirmRequired), matchesField(passwordField, MESSAGES.confirmMismatch)];
}

export function trimValue(value: string): string {
  return value.trim();
}
