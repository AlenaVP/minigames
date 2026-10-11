import type { FirebaseOptions } from 'firebase/app';

/**
 * Firebase web app config (Project settings → General → Your apps → SDK setup and configuration → Config).
 * Not a secret: it identifies the project and ends up in the JS bundle of any Firebase site anyway.
 * Access is limited by Authentication → Settings → Authorized domains.
 */
export const FIREBASE_CONFIG: FirebaseOptions = {
  apiKey: 'AIzaSyARkgO0sNi6jXG3sICMyT0s4gkvjPJRT6I',
  authDomain: 'minigames-e33ef.firebaseapp.com',
  projectId: 'minigames-e33ef',
  storageBucket: 'minigames-e33ef.firebasestorage.app',
  messagingSenderId: '709838721999',
  appId: '1:709838721999:web:c862b3e03aea3493b138ba',
};
