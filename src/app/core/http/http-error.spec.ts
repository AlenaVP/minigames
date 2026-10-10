import { describe, expect, it } from 'vitest';
import { HttpError, getHttpErrorKind, isAbortedRequest, toTransportError } from './http-error';

describe('getHttpErrorKind', () => {
  it.each([
    [400, 'bad-request'],
    [404, 'not-found'],
    [422, 'bad-request'],
    [429, 'rate-limit'],
    [500, 'server'],
    [503, 'server'],
  ] as const)('%d → %s', (status, kind) => {
    expect(getHttpErrorKind(status)).toBe(kind);
  });
});

describe('HttpError', () => {
  it('uses a readable default message and keeps the status', () => {
    const error = new HttpError('rate-limit', { status: 429 });
    expect(error.message).toBe('Too many requests. Please try again in a moment.');
    expect(error.status).toBe(429);
    expect(error.name).toBe('HttpError');
  });

  it('prefers the message from the server', () => {
    expect(new HttpError('bad-request', { message: 'Invalid page parameter' }).message).toBe('Invalid page parameter');
  });

  it('has no status when no response arrived', () => {
    expect(new HttpError('network').status).toBeNull();
  });

  it.each([
    ['timeout', true],
    ['network', true],
    ['server', true],
    ['rate-limit', true],
    ['invalid-response', true],
    ['not-found', false],
    ['bad-request', false],
    ['aborted', false],
  ] as const)('%s is retryable: %s', (kind, expected) => {
    expect(new HttpError(kind).isRetryable).toBe(expected);
  });
});

describe('toTransportError', () => {
  it('maps the reasons fetch() rejects with', () => {
    expect(toTransportError(new DOMException('t', 'TimeoutError')).kind).toBe('timeout');
    expect(toTransportError(new DOMException('a', 'AbortError')).kind).toBe('aborted');
    expect(toTransportError(new TypeError('Failed to fetch')).kind).toBe('network');
  });

  it('passes an HttpError through unchanged', () => {
    const error = new HttpError('server');
    expect(toTransportError(error)).toBe(error);
  });

  it('keeps the original error as the cause', () => {
    const cause = new TypeError('Failed to fetch');
    expect(toTransportError(cause).cause).toBe(cause);
  });
});

describe('isAbortedRequest', () => {
  it('is true only for our own cancellations', () => {
    expect(isAbortedRequest(new HttpError('aborted'))).toBe(true);
    expect(isAbortedRequest(new HttpError('timeout'))).toBe(false);
    expect(isAbortedRequest(new DOMException('a', 'AbortError'))).toBe(false);
  });
});
