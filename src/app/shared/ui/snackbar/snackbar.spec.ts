// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { installPopoverStub, isPopoverOpen, query, queryAll, textOf } from '@testing/dom';
import { Snackbar } from '.';

const items = (): HTMLElement[] => queryAll('.snackbar__item:not(.snackbar__item--leaving)');
const texts = (): string[] => items().map((item) => textOf(item));
/** dismiss() removes the element after its leave animation — none in happy-dom, so after a microtask */
const flush = async (): Promise<void> => {
  await Promise.resolve();
  await Promise.resolve();
};

describe('Snackbar', () => {
  let snackbar: Snackbar;

  beforeEach(() => {
    installPopoverStub();
    vi.useFakeTimers();
    snackbar = new Snackbar();
    snackbar.mount(document.body);
  });

  afterEach(() => {
    snackbar.destroy();
    vi.useRealTimers();
    document.body.replaceChildren();
  });

  it('is a polite live region shown as a popover (top layer)', () => {
    const region = query('.snackbar');

    expect(region.getAttribute('aria-live')).toBe('polite');
    expect(isPopoverOpen(region)).toBe(true);
  });

  it('shows each variant with its own modifier, the text escaped', () => {
    snackbar.success('Saved');
    snackbar.error('<b>Oops</b>');
    snackbar.info('FYI');

    expect(queryAll('.snackbar__item--success')).toHaveLength(1);
    expect(texts()).toEqual(['Saved', '<b>Oops</b>', 'FYI']);
    expect(document.querySelector('.snackbar b')).toBeNull();
  });

  it('dismisses itself after its duration: 4 s for success/info, 6 s for warning/error', async () => {
    snackbar.success('Saved');
    snackbar.warning('Careful');

    vi.advanceTimersByTime(4000);
    await flush();
    expect(texts()).toEqual(['Careful']);

    vi.advanceTimersByTime(2000);
    await flush();
    expect(items()).toHaveLength(0);
  });

  it('can be closed by hand and by the caller through its handle', async () => {
    snackbar.info('One');
    const handle = snackbar.info('Two');

    query('.snackbar__close').click();
    handle.dismiss();
    await flush();

    expect(items()).toHaveLength(0);
  });

  it('glues a repeated message into the one already shown and restarts its timer', () => {
    snackbar.error('Offline');
    vi.advanceTimersByTime(5000);
    snackbar.error('Offline');
    vi.advanceTimersByTime(5000);

    expect(texts()).toEqual(['Offline']);
  });

  it('keeps at most three: the oldest makes room', () => {
    for (const text of ['1', '2', '3', '4']) snackbar.info(text);

    expect(texts()).toEqual(['2', '3', '4']);
  });

  it('pauses while hovered or focused, so it can be read and closed', () => {
    snackbar.info('Read me');
    const item = query('.snackbar__item');

    item.dispatchEvent(new Event('pointerenter'));
    vi.advanceTimersByTime(10_000);
    expect(items()).toHaveLength(1);

    item.dispatchEvent(new Event('pointerleave'));
    item.dispatchEvent(new Event('focusin'));
    vi.advanceTimersByTime(10_000);
    expect(items()).toHaveLength(1);

    item.dispatchEvent(new Event('focusout'));
    vi.advanceTimersByTime(4000);
    expect(items()).toHaveLength(0);
  });

  it('shows nothing before it is mounted', () => {
    const detached = new Snackbar();

    detached.error('lost').dismiss();

    expect(queryAll('.snackbar__item')).toHaveLength(0);
  });
});
