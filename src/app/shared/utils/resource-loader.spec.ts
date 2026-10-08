import { describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { type RemoteData, ResourceLoader } from './resource-loader';

/** A request the test resolves or rejects by hand — to control the order of responses */
function deferred<T>(): { promise: Promise<T>; resolve: (value: T) => void; reject: (error: unknown) => void } {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

function createLoader(options: Partial<ConstructorParameters<typeof ResourceLoader<string[]>>[0]> = {}) {
  const states: RemoteData<string[]>[] = [];
  const loader = new ResourceLoader<string[]>({ onState: (state) => states.push(state), ...options });
  return { loader, states };
}

describe('ResourceLoader', () => {
  it('goes loading → success', async () => {
    const { loader, states } = createLoader();

    await loader.load(async () => ['a']);

    expect(states).toEqual([{ status: 'loading' }, { status: 'success', data: ['a'] }]);
  });

  it('reports an empty result separately when isEmpty says so', async () => {
    const { loader, states } = createLoader({ isEmpty: (data) => data.length === 0 });

    await loader.load(async () => []);

    expect(states.at(-1)).toEqual({ status: 'empty', data: [] });
  });

  it('turns an HttpError into the error state and notifies onError', async () => {
    const onError = vi.fn();
    const { loader, states } = createLoader({ onError });
    const error = new HttpError('server', { status: 500 });

    await loader.load(async () => {
      throw error;
    });

    expect(states.at(-1)).toEqual({ status: 'error', error });
    expect(onError).toHaveBeenCalledWith(error);
  });

  it('wraps an unexpected exception into an invalid-response HttpError', async () => {
    const { loader, states } = createLoader();

    await loader.load(async () => {
      throw new TypeError('boom');
    });

    const last = states.at(-1);
    expect(last?.status).toBe('error');
    expect(last?.status === 'error' && last.error.kind).toBe('invalid-response');
  });

  it('lets only the latest request update the state and aborts the previous one (switchMap)', async () => {
    const { loader, states } = createLoader();
    const first = deferred<string[]>();
    const second = deferred<string[]>();
    let firstSignal: AbortSignal | undefined;

    const firstLoad = loader.load((signal) => {
      firstSignal = signal;
      return first.promise;
    });
    const secondLoad = loader.load(() => second.promise);

    expect(firstSignal?.aborted).toBe(true);

    second.resolve(['second']);
    first.resolve(['stale']);
    await Promise.all([firstLoad, secondLoad]);

    expect(states.filter((state) => state.status === 'success')).toEqual([{ status: 'success', data: ['second'] }]);
  });

  it('ignores the rejection of a request it aborted itself', async () => {
    const { loader, states } = createLoader();
    const first = deferred<string[]>();

    const firstLoad = loader.load(() => first.promise);
    const secondLoad = loader.load(async () => ['ok']);
    first.reject(new HttpError('aborted'));
    await Promise.all([firstLoad, secondLoad]);

    expect(states.some((state) => state.status === 'error')).toBe(false);
  });

  it('retry() repeats the last request and calls onRecovered only after a successful retry', async () => {
    const onRecovered = vi.fn();
    const { loader, states } = createLoader({ onRecovered });
    const request = vi
      .fn<(signal: AbortSignal) => Promise<string[]>>()
      .mockRejectedValueOnce(new HttpError('network'))
      .mockResolvedValueOnce(['recovered']);

    await loader.load(request);
    expect(onRecovered).not.toHaveBeenCalled();

    await loader.retry();
    expect(request).toHaveBeenCalledTimes(2);
    expect(states.at(-1)).toEqual({ status: 'success', data: ['recovered'] });
    expect(onRecovered).toHaveBeenCalledTimes(1);
  });

  it('retry() before any load does nothing', async () => {
    const { loader, states } = createLoader();
    await loader.retry();
    expect(states).toEqual([]);
  });

  it('cancels the request in flight when the owner is destroyed and refuses new loads afterwards', async () => {
    const destroy = new AbortController();
    const { loader, states } = createLoader({ destroySignal: destroy.signal });
    let requestSignal: AbortSignal | undefined;

    void loader.load((signal) => {
      requestSignal = signal;
      return new Promise<string[]>(() => {});
    });
    destroy.abort();
    expect(requestSignal?.aborted).toBe(true);

    const request = vi.fn(async () => ['late']);
    await loader.load(request);
    expect(request).not.toHaveBeenCalled();
    expect(states).toEqual([{ status: 'loading' }]);
  });
});
