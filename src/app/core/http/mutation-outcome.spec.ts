import { describe, expect, it } from 'vitest';
import { HttpError, type HttpErrorKind } from './http-error';
import { getMutationOutcome } from './mutation-outcome';

describe('getMutationOutcome', () => {
  it.each<HttpErrorKind>(['bad-request', 'unauthorized', 'not-found', 'rate-limit'])(
    '%s: the server answered no — nothing changed, a manual retry is safe',
    (kind) => {
      expect(getMutationOutcome(new HttpError(kind))).toBe('rejected');
    },
  );

  it.each<HttpErrorKind>(['timeout', 'network', 'aborted', 'server', 'invalid-response'])(
    '%s: the change may already be saved — the outcome is unknown',
    (kind) => {
      expect(getMutationOutcome(new HttpError(kind))).toBe('unknown');
    },
  );

  it('treats anything that is not an HttpError as unknown (better safe than a double toggle)', () => {
    expect(getMutationOutcome(new TypeError('boom'))).toBe('unknown');
    expect(getMutationOutcome('oops')).toBe('unknown');
    expect(getMutationOutcome(null)).toBe('unknown');
  });

  it('trusts only a real HttpError, not a look-alike object with a "kind"', () => {
    expect(getMutationOutcome({ kind: 'bad-request' })).toBe('unknown');
  });
});
