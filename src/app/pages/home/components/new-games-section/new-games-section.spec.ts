// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HttpError } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import type { GameSummary } from '@shared/types/game';
import { snackbar } from '@shared/ui/snackbar';
import { query, queryAll, stubMatchMedia, textOf } from '@testing/dom';
import { makeGameSummary } from '@testing/fixtures';
import { NewGamesSection } from '.';

const GAMES = ['alpha', 'bravo', 'charlie', 'delta', 'echo'].map((slug) => makeGameSummary({ slug, name: slug }));

const center = (): string => textOf(query('[data-position="center"] .game-card__title'));
const arrow = (direction: 'prev' | 'next'): HTMLButtonElement => query(`[data-direction="${direction}"]`);

function setHidden(hidden: boolean): void {
  Object.defineProperty(document, 'hidden', { configurable: true, value: hidden });
  document.dispatchEvent(new Event('visibilitychange'));
}

describe('NewGamesSection', () => {
  let section: NewGamesSection;
  let onGameDetails: ReturnType<typeof vi.fn<(slug: string) => void>>;

  async function mount(games: readonly GameSummary[] = GAMES): Promise<void> {
    vi.spyOn(gamesApi, 'getFeatured').mockResolvedValue(games);
    section = new NewGamesSection({ onGameDetails });
    section.mount(document.body);
    await vi.waitFor(() => expect(document.querySelector('.async-content')?.getAttribute('aria-busy')).toBe('false'));
  }

  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    stubMatchMedia(false);
    onGameDetails = vi.fn<(slug: string) => void>();
    vi.spyOn(snackbar, 'error');
  });

  afterEach(() => {
    section.destroy();
    setHidden(false);
    vi.useRealTimers();
  });

  it('starts with the first game in the center and the arrows enabled', async () => {
    await mount();

    expect(center()).toBe('alpha');
    expect(arrow('prev').disabled).toBe(false);
    expect(arrow('next').disabled).toBe(false);
  });

  it('labels every slide by its place in the list and hides the far ones from Tab', async () => {
    await mount();

    const slides = queryAll('.new-games__card');
    expect(slides.map((slide) => slide.getAttribute('aria-label')).toSorted()).toEqual(
      ['1 of 5', '2 of 5', '3 of 5', '4 of 5', '5 of 5'].toSorted(),
    );
    expect(queryAll('[data-position="center"], [data-position="near"]').every((slide) => !slide.inert)).toBe(true);
    expect(queryAll('[data-position="far"]').every((slide) => slide.inert)).toBe(true);
  });

  it('moves one game per arrow click, wrapping around the ends', async () => {
    await mount();

    arrow('next').click();
    expect(center()).toBe('bravo');
    arrow('prev').click();
    arrow('prev').click();
    expect(center()).toBe('echo');
  });

  it('plays by itself every 4 seconds', async () => {
    await mount();

    vi.advanceTimersByTime(4000);
    expect(center()).toBe('bravo');
    vi.advanceTimersByTime(4000);
    expect(center()).toBe('charlie');
  });

  it('restarts the countdown after an arrow click', async () => {
    await mount();

    vi.advanceTimersByTime(3000);
    arrow('next').click();
    vi.advanceTimersByTime(3000);

    expect(center()).toBe('bravo');
  });

  it('pauses while the tab is hidden and while a dialog is open', async () => {
    await mount();

    setHidden(true);
    vi.advanceTimersByTime(10_000);
    expect(center()).toBe('alpha');
    setHidden(false);

    const dialog = document.createElement('dialog');
    document.body.append(dialog);
    const opened = new Event('toggle');
    Object.defineProperty(opened, 'newState', { value: 'open' });
    dialog.dispatchEvent(opened);
    vi.advanceTimersByTime(10_000);
    expect(center()).toBe('alpha');

    const closed = new Event('toggle');
    Object.defineProperty(closed, 'newState', { value: 'closed' });
    dialog.dispatchEvent(closed);
    vi.advanceTimersByTime(4000);
    expect(center()).toBe('bravo');
    dialog.remove();
  });

  it('steps with a swipe', async () => {
    await mount();
    const viewport = query('.new-games__viewport');

    viewport.dispatchEvent(new PointerEvent('pointerdown', { pointerId: 1, clientX: 300, bubbles: true }));
    document.dispatchEvent(new PointerEvent('pointerup', { pointerId: 1, clientX: 100, bubbles: true }));

    expect(center()).toBe('bravo');
  });

  it('opens the details of a clicked card', async () => {
    await mount();

    query('[data-position="center"] .game-card__inner').click();

    expect(onGameDetails).toHaveBeenCalledWith('alpha');
  });

  it('keeps the arrows disabled when there is only one game', async () => {
    await mount([makeGameSummary()]);

    expect(arrow('next').disabled).toBe(true);
    vi.advanceTimersByTime(10_000);
  });

  it('shows the empty state for no games and the error banner for a failed request', async () => {
    await mount([]);
    expect(textOf(query('.empty-state__title'))).toBe('No new games yet');
    section.destroy();

    vi.spyOn(gamesApi, 'getFeatured').mockRejectedValue(new HttpError('server'));
    section = new NewGamesSection({ onGameDetails });
    section.mount(document.body);
    await vi.waitFor(() => expect(document.querySelector('.error-banner')).not.toBeNull());
    expect(arrow('next').disabled).toBe(true);
  });

  it('shows two neighbours on each side from 1440px', async () => {
    const desktopMid = stubMatchMedia(false);
    await mount();

    desktopMid.setMatches(true);

    expect(queryAll('[data-position="far"]').every((slide) => !slide.inert)).toBe(true);
  });
});
