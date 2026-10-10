import type * as AppSdkModule from 'firebase/app';
import type { FirebaseOptions } from 'firebase/app';
import type * as AuthSdkModule from 'firebase/auth';
import type { Auth, User } from 'firebase/auth';
import type { AuthUser, SignUpResult } from '@shared/types/auth';
import type { AuthProvider } from './auth-provider';
import { AuthError, toAuthError } from './auth-errors';

type AppSdk = typeof AppSdkModule;
type AuthSdk = typeof AuthSdkModule;

interface FirebaseSession {
  auth: Auth;
  sdk: AuthSdk;
}

function toAuthUser(user: User, displayName = user.displayName): AuthUser {
  return { email: user.email, displayName, photoUrl: user.photoURL };
}

/**
 * Firebase Authentication behind the AuthProvider contract.
 *
 * Lazy loading (the analogue of a lazy-loaded Angular module): the SDK is downloaded and initializeApp() runs
 * on the first auth action, not on page load — a guest who never signs in never downloads Firebase.
 *
 * Firebase only confirms the identity. Whether the UI treats the user as signed in is decided by the app
 * session (5 minutes), so nothing here reads auth.currentUser or listens to onAuthStateChanged.
 */
export class FirebaseAuthProvider implements AuthProvider {
  private readonly config: FirebaseOptions;
  private session: Promise<FirebaseSession> | null = null;

  constructor(config: FirebaseOptions) {
    this.config = config;
  }

  async signInWithEmail(email: string, password: string): Promise<AuthUser> {
    return this.run(async ({ auth, sdk }) => {
      const { user } = await sdk.signInWithEmailAndPassword(auth, email, password);
      return toAuthUser(user);
    });
  }

  async signUpWithEmail(email: string, password: string, displayName: string): Promise<SignUpResult> {
    return this.run(async ({ auth, sdk }) => {
      const { user } = await sdk.createUserWithEmailAndPassword(auth, email, password);

      // The account already exists at this point: a failed profile update must not turn into "sign-up failed"
      try {
        await sdk.updateProfile(user, { displayName });
        return { user: toAuthUser(user, displayName), isDisplayNameSaved: true };
      } catch {
        return { user: toAuthUser(user, displayName), isDisplayNameSaved: false };
      }
    });
  }

  async signInWithGoogle(): Promise<AuthUser> {
    return this.run(async ({ auth, sdk }) => {
      const provider = new sdk.GoogleAuthProvider();
      // Always show the account chooser — otherwise Google silently reuses the last account
      provider.setCustomParameters({ prompt: 'select_account' });

      const { user } = await sdk.signInWithPopup(auth, provider);
      return toAuthUser(user);
    });
  }

  async signOut(): Promise<void> {
    return this.run(({ auth, sdk }) => sdk.signOut(auth));
  }

  /** Every Firebase call goes through here: one place that loads the SDK and maps errors to AuthError */
  private async run<T>(action: (session: FirebaseSession) => Promise<T>): Promise<T> {
    try {
      return await action(await this.getSession());
    } catch (error) {
      throw toAuthError(error);
    }
  }

  private getSession(): Promise<FirebaseSession> {
    this.session ??= this.initialize();

    // A failed download (offline) is not cached: the next attempt loads the SDK again
    this.session.catch(() => {
      this.session = null;
    });

    return this.session;
  }

  private async initialize(): Promise<FirebaseSession> {
    let modules: [AppSdk, AuthSdk];
    try {
      modules = await Promise.all([import('firebase/app'), import('firebase/auth')]);
    } catch (error) {
      // The SDK chunk could not be downloaded (offline, or a new deploy replaced the file)
      throw new AuthError('network', { cause: error });
    }

    const [{ initializeApp }, sdk] = modules;
    const app = initializeApp(this.config);
    return { auth: sdk.getAuth(app), sdk };
  }
}
