import { vi } from 'vitest';

/** The first element matching `selector`, or a failed test — keeps specs free of `?.` chains */
export function query<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T {
  const element = root.querySelector<T>(selector);
  if (!element) throw new Error(`Nothing matches ${selector}`);
  return element;
}

export function queryAll<T extends Element = HTMLElement>(selector: string, root: ParentNode = document): T[] {
  return [...root.querySelectorAll<T>(selector)];
}

/** Visible text with the whitespace of the template literals collapsed */
export function textOf(element: Element): string {
  return (element.textContent ?? '').replaceAll(/\s+/g, ' ').trim();
}

export interface MediaQueryStub {
  /** Flips the query and notifies the 'change' listeners, like a window resize across the breakpoint */
  setMatches(matches: boolean): void;
}

/** happy-dom answers every media query from its own window size; this makes one answer controllable */
export function stubMatchMedia(initial: boolean): MediaQueryStub {
  let matches = initial;
  const listeners = new Set<(event: MediaQueryListEvent) => void>();

  vi.stubGlobal(
    'matchMedia',
    vi.fn((media: string) => ({
      media,
      get matches() {
        return matches;
      },
      addEventListener: (
        _type: string,
        listener: (event: MediaQueryListEvent) => void,
        options?: AddEventListenerOptions,
      ) => {
        listeners.add(listener);
        options?.signal?.addEventListener('abort', () => listeners.delete(listener));
      },
      removeEventListener: (_type: string, listener: (event: MediaQueryListEvent) => void) => listeners.delete(listener),
    })),
  );

  return {
    setMatches(next) {
      matches = next;
      for (const listener of listeners) listener({ matches: next } as MediaQueryListEvent);
    },
  };
}

const OPEN_ATTRIBUTE = 'data-test-popover-open';

/**
 * happy-dom has no Popover API. This is just enough of it for components that call show/hidePopover:
 * the open state becomes an attribute the test can read. Each spec file runs in its own environment,
 * so defining the methods once per file is enough.
 */
/** Source of the two stubbed methods (a class, so `this` is the element they are called on) */
class PopoverMethods extends HTMLElement {
  showPopover(): void {
    this.setAttribute(OPEN_ATTRIBUTE, '');
  }

  hidePopover(): void {
    this.removeAttribute(OPEN_ATTRIBUTE);
  }
}

export function installPopoverStub(): void {
  if ('showPopover' in HTMLElement.prototype) return;

  Object.defineProperties(HTMLElement.prototype, {
    showPopover: { configurable: true, value: PopoverMethods.prototype.showPopover },
    hidePopover: { configurable: true, value: PopoverMethods.prototype.hidePopover },
  });
}

export const isPopoverOpen = (element: Element): boolean => element.hasAttribute(OPEN_ATTRIBUTE);
