import { HttpError, type HttpErrorKind } from './http-error';

/**
 * After a POST failed — did the server change anything?
 *
 *   rejected  The server answered "no" (400, 401, 404, 429): nothing changed.
 *             Unlock the control, keep what the user typed; the user may simply try again.
 *
 *   unknown   No answer we can trust: timeout, lost connection, our own abort, 5xx, or a 2xx we could not read.
 *             The change may already be saved. NEVER repeat it automatically — the favorite and like endpoints
 *             are toggles, so a second POST would undo the first. Tell the user, keep their input, and reload
 *             the real state with a GET (safe to repeat).
 */
export type MutationOutcome = 'rejected' | 'unknown';

const REJECTED_KINDS: ReadonlySet<HttpErrorKind> = new Set(['bad-request', 'unauthorized', 'not-found', 'rate-limit']);

export function getMutationOutcome(error: unknown): MutationOutcome {
  return error instanceof HttpError && REJECTED_KINDS.has(error.kind) ? 'rejected' : 'unknown';
}
