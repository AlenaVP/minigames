import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PausableTimer } from './pausable-timer';

describe('PausableTimer', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('fires once after the full duration', () => {
    const callback = vi.fn();
    const timer = new PausableTimer(callback, 4000);

    timer.start();
    expect(timer.isRunning).toBe(true);

    vi.advanceTimersByTime(3999);
    expect(callback).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(timer.isRunning).toBe(false);
  });

  it('keeps only the remaining time across pause and resume', () => {
    const callback = vi.fn();
    const timer = new PausableTimer(callback, 4000);

    timer.start();
    vi.advanceTimersByTime(1300);
    timer.pause();
    expect(timer.isRunning).toBe(false);

    // A paused timer never fires, however long the user hovers
    vi.advanceTimersByTime(60_000);
    expect(callback).not.toHaveBeenCalled();

    timer.resume();
    vi.advanceTimersByTime(2699);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('ignores pause() when idle and resume() when not paused', () => {
    const callback = vi.fn();
    const timer = new PausableTimer(callback, 1000);

    timer.pause();
    timer.resume();
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
  });

  it('reset() restarts a running timer with the full duration', () => {
    const callback = vi.fn();
    const timer = new PausableTimer(callback, 1000);

    timer.start();
    vi.advanceTimersByTime(900);
    timer.reset();
    vi.advanceTimersByTime(900);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('reset() on a paused timer restores the full duration but stays paused', () => {
    const callback = vi.fn();
    const timer = new PausableTimer(callback, 1000);

    timer.start();
    vi.advanceTimersByTime(800);
    timer.pause();
    timer.reset();
    expect(timer.isRunning).toBe(false);

    timer.resume();
    vi.advanceTimersByTime(999);
    expect(callback).not.toHaveBeenCalled();
    vi.advanceTimersByTime(1);
    expect(callback).toHaveBeenCalledTimes(1);
  });

  it('stop() cancels the countdown', () => {
    const callback = vi.fn();
    const timer = new PausableTimer(callback, 1000);

    timer.start();
    timer.stop();
    vi.advanceTimersByTime(5000);
    expect(callback).not.toHaveBeenCalled();
    expect(timer.isRunning).toBe(false);
  });
});
