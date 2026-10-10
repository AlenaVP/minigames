import { SESSION_CLOCK_SKEW_MS, SESSION_STORAGE_KEY, SESSION_TTL_MS } from '@app/core/constants/session';
import { authProvider } from '@app/services/auth';
import { SessionService } from './session.service';

export { SessionService } from './session.service';

/** App-wide singleton (providedIn: 'root') */
export const sessionService = new SessionService({
  storage: globalThis.localStorage,
  authProvider,
  storageKey: SESSION_STORAGE_KEY,
  ttlMs: SESSION_TTL_MS,
  clockSkewMs: SESSION_CLOCK_SKEW_MS,
});
