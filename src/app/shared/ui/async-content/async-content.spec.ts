// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { snackbar } from '@shared/ui/snackbar';
import { EmptyState } from '@shared/ui/empty-state';
import { query, textOf } from '@testing/dom';
import { AsyncContent, type AsyncContentOptions } from '.';

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (error: unknown) => void;
}

function defer<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((onResolve, onReject) => {
    resolve = onResolve;
    reject = onReject;
  });
  return { promise, resolve, reject };
}

function skeleton(): HTMLElement {
  const element = document.createElement('p');
  element.className = 'test-skeleton';
  return element;
}

function content(items: string[]): HTMLElement {
  const element = document.createElement('ul');
  element.className = 'test-content';
  element.textContent = items.join(',');
  return element;
}

const area = (): HTMLElement => query('.async-content');

describe('AsyncContent', () => {
  let component: AsyncContent<string[]>;

  function mount(options: Partial<AsyncContentOptions<string[]>> = {}): void {
    component = new AsyncContent<string[]>({
      label: 'top players',
      renderSkeleton: skeleton,
      renderContent: content,
      isEmpty: (items) => items.length === 0,
      ...options,
    });
    component.mount(document.body);
  }

  beforeEach(() => {
    vi.spyOn(snackbar, 'error');
    vi.spyOn(snackbar, 'success');
  });

  afterEach(() => {
    component.destroy();
  });

  it('shows an inert skeleton with a screen-reader label while loading, then the content', async () => {
    const request = defer<string[]>();
    mount({ request: () => request.promise });

    expect(area().getAttribute('aria-busy')).toBe('true');
    expect(query('.test-skeleton').inert).toBe(true);
    expect(textOf(query('.async-content__loading .visually-hidden'))).toBe('Loading top players…');

    request.resolve(['Alex', 'Mia']);
    await vi.waitFor(() => expect(textOf(query('.test-content'))).toBe('Alex,Mia'));
    expect(area().getAttribute('aria-busy')).toBe('false');
    expect(document.querySelector('.test-skeleton')).toBeNull();
  });

  it('waits for load() when no request is given (parameters come later, e.g. from the URL)', async () => {
    mount();
    expect(document.querySelector('.test-skeleton')).toBeNull();

    await component.load(async () => ['later']);

    expect(textOf(query('.test-content'))).toBe('later');
  });

  it('shows the default empty state for an empty result', async () => {
    mount();
    await component.load(async () => []);

    expect(textOf(query('.empty-state__title'))).toBe('Nothing to show yet');
  });

  it('lets the owner render its own empty state', async () => {
    mount({ renderEmpty: () => new EmptyState({ title: 'Data Not Found' }) });
    await component.load(async () => []);

    expect(textOf(query('.empty-state__title'))).toBe('Data Not Found');
  });

  it('shows an error banner and an error toast; Try again repeats the request and reports the recovery', async () => {
    const request = vi
      .fn<(signal: AbortSignal) => Promise<string[]>>()
      .mockRejectedValueOnce(new HttpError('network'))
      .mockResolvedValueOnce(['back']);
    mount();

    await component.load(request);
    expect(textOf(query('.error-banner__title'))).toBe("Couldn't load top players");
    expect(snackbar.error).toHaveBeenCalledWith(expect.stringMatching(/^Couldn't load top players\./));

    query('.error-banner__retry').click();
    await vi.waitFor(() => expect(textOf(query('.test-content'))).toBe('back'));
    expect(request).toHaveBeenCalledTimes(2);
    expect(snackbar.success).toHaveBeenCalledWith('Top players loaded.');
  });

  it('takes the error toast back as soon as the data arrives', async () => {
    const dismiss = vi.fn();
    vi.mocked(snackbar.error).mockReturnValue({ dismiss });
    mount();

    await component.load(async () => {
      throw new HttpError('timeout');
    });
    await component.load(async () => ['ok']);

    expect(dismiss).toHaveBeenCalledOnce();
  });

  it('shows no toast for 404 and lets the owner replace the banner (Game Not Found)', async () => {
    mount({
      renderError: (error) => (error.kind === 'not-found' ? new EmptyState({ title: 'Game Not Found' }) : null),
    });

    await component.load(async () => {
      throw new HttpError('not-found');
    });

    expect(textOf(query('.empty-state__title'))).toBe('Game Not Found');
    expect(snackbar.error).not.toHaveBeenCalled();
  });

  it('keeps the newest request only: an older answer that arrives late is ignored', async () => {
    const slow = defer<string[]>();
    mount();

    void component.load(() => slow.promise);
    await component.load(async () => ['new']);
    slow.resolve(['old']);
    await slow.promise;

    expect(textOf(query('.test-content'))).toBe('new');
  });

  it('reports every state to the owner', async () => {
    const onStateChange = vi.fn();
    mount({ onStateChange });

    await component.load(async () => ['x']);

    expect(onStateChange.mock.calls.map(([state]) => state.status)).toEqual(['loading', 'success']);
  });

  it('keeps the focus inside the area when the focused Try again disappears', async () => {
    mount();
    await component.load(async () => {
      throw new HttpError('network');
    });
    query('.error-banner__retry').focus();

    await component.retry();

    expect(document.activeElement).toBe(area());
  });
});
