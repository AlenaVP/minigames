import { describe, expect, it } from 'vitest';
import { makeAuthUser } from '@testing/auth';
import {
  createAppSession,
  isFromTheFuture,
  isSessionExpired,
  parseStoredSession,
  resolveDisplayName,
  serializeSession,
} from './app-session';

const TTL = 5 * 60 * 1000;
const session = { displayName: 'Alex Pro', email: 'alex@minigames.com', authenticatedAt: 1_000_000 };

describe('parseStoredSession', () => {
  it('reports "nothing stored" for a missing key', () => {
    expect(parseStoredSession(null)).toEqual({ status: 'none' });
  });

  it('accepts a complete record, with or without an avatar', () => {
    expect(parseStoredSession(JSON.stringify(session))).toEqual({ status: 'valid', session });

    const withAvatar = { ...session, avatarUrl: 'https://lh3.googleusercontent.com/a/x' };
    expect(parseStoredSession(JSON.stringify(withAvatar))).toEqual({ status: 'valid', session: withAvatar });
  });

  it.each([
    ['not JSON', '{displayName: Alex'],
    ['JSON but not an object', '"Alex"'],
    ['null', 'null'],
    ['missing email', JSON.stringify({ displayName: 'Alex', authenticatedAt: 1 })],
    ['missing authenticatedAt', JSON.stringify({ displayName: 'Alex', email: 'a@b.co' })],
    ['authenticatedAt as a string', JSON.stringify({ ...session, authenticatedAt: '1000000' })],
    ['authenticatedAt as an ISO date', JSON.stringify({ ...session, authenticatedAt: '2026-10-10T10:00:00Z' })],
    ['fractional authenticatedAt', JSON.stringify({ ...session, authenticatedAt: 1.5 })],
    ['negative authenticatedAt', JSON.stringify({ ...session, authenticatedAt: -1 })],
    ['empty displayName', JSON.stringify({ ...session, displayName: ' '.repeat(2) })],
    ['email as a number', JSON.stringify({ ...session, email: 42 })],
    ['avatarUrl null', JSON.stringify({ ...session, avatarUrl: null })],
  ])('rejects %s', (_label, raw) => {
    expect(parseStoredSession(raw)).toEqual({ status: 'invalid' });
  });
});

describe('expiration', () => {
  it('is active until exactly authenticatedAt + lifetime', () => {
    expect(isSessionExpired(session, session.authenticatedAt + TTL - 1, TTL)).toBe(false);
    expect(isSessionExpired(session, session.authenticatedAt + TTL, TTL)).toBe(true);
  });

  it('flags a timestamp from the future beyond the clock skew', () => {
    expect(isFromTheFuture(session, session.authenticatedAt - 30_000, 60_000)).toBe(false);
    expect(isFromTheFuture(session, session.authenticatedAt - 61_000, 60_000)).toBe(true);
  });
});

describe('serializeSession', () => {
  it('stores only the documented fields', () => {
    const extended = { ...session, password: 'secret', idToken: 'jwt' } as typeof session;
    expect(JSON.parse(serializeSession(extended))).toEqual(session);
  });

  it('writes avatarUrl only when there is one', () => {
    expect(serializeSession(session)).not.toContain('avatarUrl');
    expect(JSON.parse(serializeSession({ ...session, avatarUrl: 'https://x/a.png' })).avatarUrl).toBe('https://x/a.png');
  });
});

describe('resolveDisplayName', () => {
  it.each([
    [makeAuthUser({ displayName: '  Alex Pro ' }), 'Alex Pro'],
    [makeAuthUser({ displayName: null, email: 'cozy.gamer@minigames.com' }), 'cozy.gamer'],
    [makeAuthUser({ displayName: ' '.repeat(3), email: 'cozy@minigames.com' }), 'cozy'],
    [makeAuthUser({ displayName: null, email: null }), 'Player'],
  ])('%j → %s', (user, expected) => {
    expect(resolveDisplayName(user)).toBe(expected);
  });
});

describe('createAppSession', () => {
  it('stamps the authentication moment and keeps the Google photo', () => {
    const created = createAppSession(makeAuthUser({ photoUrl: 'https://lh3.googleusercontent.com/a/x' }), 42);
    expect(created).toEqual({
      displayName: 'Alex Pro',
      email: 'alex@minigames.com',
      authenticatedAt: 42,
      avatarUrl: 'https://lh3.googleusercontent.com/a/x',
    });
  });

  it('leaves avatarUrl out when the provider has no photo', () => {
    expect(createAppSession(makeAuthUser({ photoUrl: null }), 42)).not.toHaveProperty('avatarUrl');
  });

  it('refuses an identity without an email (the API needs it as userEmail)', () => {
    expect(() => createAppSession(makeAuthUser({ email: null }), 42)).toThrow(/no email/);
  });
});
