import { beforeEach, describe, expect, it, vi } from 'vitest';
import { AuthError } from './auth-errors';
import { FirebaseAuthProvider } from './firebase-auth.provider';

// The Firebase SDK is replaced by fakes: the tests check what OUR code asks Firebase to do and how it maps answers
const firebase = vi.hoisted(() => {
  const fakeAuth = { name: 'fake-auth' };
  const setCustomParameters = vi.fn();

  return {
    fakeAuth,
    setCustomParameters,
    initializeApp: vi.fn(() => ({ name: 'fake-app' })),
    getAuth: vi.fn(() => fakeAuth),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    updateProfile: vi.fn(),
    signInWithPopup: vi.fn(),
    signOut: vi.fn(),
    GoogleAuthProvider: class FakeGoogleAuthProvider {
      setCustomParameters = setCustomParameters;
    },
  };
});

vi.mock('firebase/app', () => ({ initializeApp: firebase.initializeApp }));
vi.mock('firebase/auth', () => ({
  getAuth: firebase.getAuth,
  signInWithEmailAndPassword: firebase.signInWithEmailAndPassword,
  createUserWithEmailAndPassword: firebase.createUserWithEmailAndPassword,
  updateProfile: firebase.updateProfile,
  signInWithPopup: firebase.signInWithPopup,
  signOut: firebase.signOut,
  GoogleAuthProvider: firebase.GoogleAuthProvider,
}));

const CONFIG = { apiKey: 'test-key', authDomain: 'demo.firebaseapp.com', projectId: 'demo', appId: '1:2:web:3' };

const firebaseUser = (overrides: Record<string, string | null> = {}) => ({
  email: 'alex@minigames.com',
  displayName: 'Alex Pro',
  photoURL: 'https://lh3.googleusercontent.com/a/photo',
  ...overrides,
});

const firebaseError = (code: string): Error => Object.assign(new Error(code), { code });

describe('FirebaseAuthProvider', () => {
  let provider: FirebaseAuthProvider;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new FirebaseAuthProvider(CONFIG);
  });

  describe('lazy initialization', () => {
    it('does not touch Firebase until the first auth action', () => {
      expect(firebase.initializeApp).not.toHaveBeenCalled();
    });

    it('initializes the app once with the project config and reuses it', async () => {
      firebase.signOut.mockImplementation(async () => {});

      await provider.signOut();
      await provider.signOut();

      expect(firebase.initializeApp).toHaveBeenCalledTimes(1);
      expect(firebase.initializeApp).toHaveBeenCalledWith(CONFIG);
      expect(firebase.getAuth).toHaveBeenCalledTimes(1);
    });

    it('does not cache a failed initialization: the next action tries again', async () => {
      firebase.initializeApp.mockImplementationOnce(() => {
        throw firebaseError('auth/invalid-api-key');
      });
      firebase.signOut.mockImplementation(async () => {});

      await expect(provider.signOut()).rejects.toMatchObject({ kind: 'configuration' });
      await expect(provider.signOut()).resolves.toBeUndefined();
      expect(firebase.initializeApp).toHaveBeenCalledTimes(2);
    });
  });

  describe('signInWithEmail', () => {
    it('signs in with email and password and returns only what the app needs', async () => {
      firebase.signInWithEmailAndPassword.mockResolvedValue({ user: firebaseUser() });

      const user = await provider.signInWithEmail('alex@minigames.com', 'Secret1!');

      expect(firebase.signInWithEmailAndPassword).toHaveBeenCalledWith(firebase.fakeAuth, 'alex@minigames.com', 'Secret1!');
      expect(user).toEqual({
        email: 'alex@minigames.com',
        displayName: 'Alex Pro',
        photoUrl: 'https://lh3.googleusercontent.com/a/photo',
      });
    });

    it('rejects with an AuthError, not with the raw Firebase error', async () => {
      firebase.signInWithEmailAndPassword.mockRejectedValue(firebaseError('auth/invalid-credential'));

      const request = provider.signInWithEmail('alex@minigames.com', 'wrong');

      await expect(request).rejects.toBeInstanceOf(AuthError);
      await expect(request).rejects.toMatchObject({ kind: 'invalid-credential', code: 'auth/invalid-credential' });
    });
  });

  describe('signUpWithEmail', () => {
    it('creates the account and saves the username as displayName', async () => {
      const created = firebaseUser({ displayName: null, photoURL: null });
      firebase.createUserWithEmailAndPassword.mockResolvedValue({ user: created });
      firebase.updateProfile.mockImplementation(async () => {});

      const result = await provider.signUpWithEmail('cozy@minigames.com', 'Abc12!', 'CozyGamer99');

      expect(firebase.createUserWithEmailAndPassword).toHaveBeenCalledWith(
        firebase.fakeAuth,
        'cozy@minigames.com',
        'Abc12!',
      );
      expect(firebase.updateProfile).toHaveBeenCalledWith(created, { displayName: 'CozyGamer99' });
      expect(result).toEqual({
        user: { email: 'alex@minigames.com', displayName: 'CozyGamer99', photoUrl: null },
        isDisplayNameSaved: true,
      });
    });

    it('still succeeds when only the profile update fails (the account already exists)', async () => {
      firebase.createUserWithEmailAndPassword.mockResolvedValue({ user: firebaseUser({ displayName: null }) });
      firebase.updateProfile.mockRejectedValue(firebaseError('auth/network-request-failed'));

      const result = await provider.signUpWithEmail('cozy@minigames.com', 'Abc12!', 'CozyGamer99');

      expect(result.isDisplayNameSaved).toBe(false);
      expect(result.user.displayName).toBe('CozyGamer99');
    });

    it('maps an already registered email', async () => {
      firebase.createUserWithEmailAndPassword.mockRejectedValue(firebaseError('auth/email-already-in-use'));

      await expect(provider.signUpWithEmail('cozy@minigames.com', 'Abc12!', 'CozyGamer99')).rejects.toMatchObject({
        kind: 'email-in-use',
      });
      expect(firebase.updateProfile).not.toHaveBeenCalled();
    });
  });

  describe('signInWithGoogle', () => {
    it('opens the Google popup with the account chooser', async () => {
      firebase.signInWithPopup.mockResolvedValue({ user: firebaseUser() });

      const user = await provider.signInWithGoogle();

      expect(firebase.setCustomParameters).toHaveBeenCalledWith({ prompt: 'select_account' });
      expect(firebase.signInWithPopup).toHaveBeenCalledWith(firebase.fakeAuth, expect.any(firebase.GoogleAuthProvider));
      expect(user.photoUrl).toBe('https://lh3.googleusercontent.com/a/photo');
    });

    it('reports a closed popup as a cancellation', async () => {
      firebase.signInWithPopup.mockRejectedValue(firebaseError('auth/popup-closed-by-user'));

      await expect(provider.signInWithGoogle()).rejects.toMatchObject({ kind: 'cancelled', isCancellation: true });
    });
  });

  describe('signOut', () => {
    it('signs out of Firebase so its own persistence cannot restore the user', async () => {
      firebase.signOut.mockImplementation(async () => {});

      await provider.signOut();

      expect(firebase.signOut).toHaveBeenCalledWith(firebase.fakeAuth);
    });

    it('maps a failed sign-out', async () => {
      firebase.signOut.mockRejectedValue(firebaseError('auth/network-request-failed'));

      await expect(provider.signOut()).rejects.toMatchObject({ kind: 'network' });
    });
  });
});

describe('FirebaseAuthProvider — SDK download', () => {
  it('reports an SDK chunk that cannot be downloaded (offline) as a network error', async () => {
    vi.resetModules();
    vi.doMock('firebase/auth', () => {
      throw new TypeError('Failed to fetch dynamically imported module');
    });
    const { FirebaseAuthProvider: FreshProvider } = await import('./firebase-auth.provider');
    const offlineProvider = new FreshProvider(CONFIG);

    await expect(offlineProvider.signOut()).rejects.toMatchObject({ kind: 'network' });

    vi.doUnmock('firebase/auth');
    vi.resetModules();
  });
});
