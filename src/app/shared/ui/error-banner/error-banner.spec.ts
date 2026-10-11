// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { query, textOf } from '@testing/dom';
import { ErrorBanner } from '.';

describe('ErrorBanner', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('shows the title and the error message as text', () => {
    new ErrorBanner({ title: "Couldn't load <b>games</b>", error: new HttpError('network') }).mount(document.body);

    expect(textOf(query('.error-banner__title'))).toBe("Couldn't load <b>games</b>");
    expect(textOf(query('.error-banner__message'))).toBe(new HttpError('network').message);
    expect(document.querySelector('.error-banner b')).toBeNull();
  });

  it('offers Try again for an error a repeat can fix', () => {
    const onRetry = vi.fn();
    new ErrorBanner({ title: 'x', error: new HttpError('timeout'), onRetry }).mount(document.body);

    query('.error-banner__retry').click();

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('has no Try again when repeating the same request cannot help (400) or nobody can retry', () => {
    new ErrorBanner({ title: 'x', error: new HttpError('bad-request'), onRetry: vi.fn() }).mount(document.body);
    new ErrorBanner({ title: 'y', error: new HttpError('network') }).mount(document.body);

    expect(document.querySelector('.error-banner__retry')).toBeNull();
  });
});
