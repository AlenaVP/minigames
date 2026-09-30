type TimerState = 'idle' | 'running' | 'paused';

/**
 * One-shot countdown that can be paused and resumed with the REMAINING time kept.
 *
 *   start()  → full duration from now
 *   pause()  → remember what is left (e.g. 2.7 s of 4 s)
 *   resume() → count down only what was left
 *   reset()  → full duration again; keeps the state (running restarts, paused stays paused)
 *
 * No DOM inside → testable with fake timers (Story 4).
 */
export class PausableTimer {
  private readonly callback: () => void;
  private readonly duration: number;
  private state: TimerState = 'idle';
  private remaining: number;
  private startedAt = 0;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;

  constructor(callback: () => void, duration: number) {
    this.callback = callback;
    this.duration = duration;
    this.remaining = duration;
  }

  get isRunning(): boolean {
    return this.state === 'running';
  }

  start(): void {
    this.clear();
    this.remaining = this.duration;
    this.run();
  }

  pause(): void {
    if (this.state !== 'running') return;

    this.clear();
    this.remaining = Math.max(0, this.remaining - (Date.now() - this.startedAt));
    this.state = 'paused';
  }

  resume(): void {
    if (this.state !== 'paused') return;
    this.run();
  }

  reset(): void {
    if (this.state === 'running') {
      this.start();
    } else {
      this.remaining = this.duration;
    }
  }

  stop(): void {
    this.clear();
    this.state = 'idle';
    this.remaining = this.duration;
  }

  private run(): void {
    this.state = 'running';
    this.startedAt = Date.now();
    this.timeoutId = setTimeout(() => {
      this.timeoutId = null;
      this.state = 'idle';
      this.callback();
    }, this.remaining);
  }

  private clear(): void {
    if (this.timeoutId !== null) clearTimeout(this.timeoutId);
    this.timeoutId = null;
  }
}
