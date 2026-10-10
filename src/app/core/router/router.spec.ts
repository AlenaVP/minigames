// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { ComponentBase } from '../component.base';
import { Router, type RouteSnapshot } from './router';

const BASE = import.meta.env.BASE_URL;

/** A page that records what happened to it */
class FakePage extends ComponentBase {
  readonly queries: string[] = [];
  destroyed = false;

  private readonly name: string;

  constructor(name: string) {
    super();
    this.name = name;
  }

  onQueryChange(query: URLSearchParams): void {
    this.queries.push(query.toString());
  }

  override destroy(): void {
    this.destroyed = true;
    super.destroy();
  }

  protected render(): HTMLElement {
    const element = document.createElement('section');
    element.dataset.page = this.name;
    return element;
  }
}

const url = (): string => `${location.pathname}${location.search}`;

function appendLink(): HTMLAnchorElement {
  const link = document.createElement('a');
  link.href = `${BASE}library`;
  link.dataset.route = 'library';
  document.body.append(link);
  return link;
}

describe('Router', () => {
  let outlet: HTMLElement;
  let pages: FakePage[];
  let router: Router;
  let snapshots: RouteSnapshot[];

  function createRouter(): Router {
    const created = new Router(outlet, {
      home: () => {
        const page = new FakePage('home');
        pages.push(page);
        return page;
      },
      library: () => {
        const page = new FakePage('library');
        pages.push(page);
        return page;
      },
      'not-found': () => new FakePage('not-found'),
    });
    created.onChange((snapshot) => snapshots.push(snapshot));
    return created;
  }

  const shownPage = (): string | undefined => outlet.querySelector<HTMLElement>('[data-page]')?.dataset.page;

  beforeEach(() => {
    history.replaceState(null, '', BASE);
    outlet = document.createElement('main');
    document.body.replaceChildren(outlet);
    pages = [];
    snapshots = [];
    vi.spyOn(globalThis, 'scrollTo').mockImplementation(() => {});
    router = createRouter();
  });

  afterEach(() => {
    router.stop();
    document.body.replaceChildren();
  });

  it('renders the page of a deep link on start()', () => {
    history.replaceState(null, '', `${BASE}library?page=2`);

    router.start();

    expect(shownPage()).toBe('library');
    expect(router.snapshot?.query.get('page')).toBe('2');
  });

  it('renders the 404 page for an unknown path without changing the URL', () => {
    history.replaceState(null, '', `${BASE}unknown/path`);

    router.start();

    expect(shownPage()).toBe('not-found');
    expect(url()).toBe(`${BASE}unknown/path`);
  });

  it('navigate() pushes a history entry, replaces the page and destroys the old one', () => {
    router.start();
    const lengthBefore = history.length;

    router.navigate('library');

    expect(url()).toBe(`${BASE}library`);
    expect(history.length).toBe(lengthBefore + 1);
    expect(shownPage()).toBe('library');
    expect(pages[0]?.destroyed).toBe(true);
  });

  it('updateQuery() keeps the page and tells it about the new query', () => {
    history.replaceState(null, '', `${BASE}library`);
    router.start();

    router.updateQuery({ sort: 'name-asc', page: '2' });

    expect(url()).toBe(`${BASE}library?sort=name-asc&page=2`);
    expect(pages).toHaveLength(1);
    expect(pages[0]?.queries).toEqual(['sort=name-asc&page=2']);
  });

  it('does not create a history entry for the URL that is already shown', () => {
    router.start();
    const lengthBefore = history.length;

    router.updateQuery({});
    router.navigate('home');

    expect(history.length).toBe(lengthBefore);
  });

  it('replace: true corrects the URL in place', () => {
    router.start();
    const lengthBefore = history.length;

    router.updateQuery({ game: 'palia' }, { replace: true });

    expect(history.length).toBe(lengthBefore);
    expect(router.snapshot?.query.get('game')).toBe('palia');
  });

  it('marks entries pushed by opening a dialog', () => {
    router.start();

    router.updateQuery({ game: 'palia' }, { dialog: true });
    expect(router.isDialogEntry).toBe(true);

    router.updateQuery({ game: null });
    expect(router.isDialogEntry).toBe(false);
  });

  it('follows Back/Forward (popstate)', () => {
    router.start();
    router.navigate('library');

    history.replaceState(null, '', BASE);
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(shownPage()).toBe('home');
  });

  it('turns a click on <a data-route> into SPA navigation (routerLink)', () => {
    router.start();

    appendLink().click();

    expect(shownPage()).toBe('library');
    expect(url()).toBe(`${BASE}library`);
  });

  it('leaves Ctrl+click to the browser (open in a new tab)', () => {
    router.start();
    let preventedByRouter: boolean | undefined;
    // Registered after the router's listener: sees its decision, then stops the test DOM from really navigating
    const probe = new AbortController();
    document.addEventListener(
      'click',
      (event) => {
        preventedByRouter = event.defaultPrevented;
        event.preventDefault();
      },
      { signal: probe.signal },
    );

    appendLink().dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, ctrlKey: true }));
    probe.abort();

    expect(preventedByRouter).toBe(false);
    expect(shownPage()).toBe('home');
  });

  it('stop() detaches the router from Back/Forward and link clicks', () => {
    router.start();
    router.stop();

    history.replaceState(null, '', `${BASE}library`);
    globalThis.dispatchEvent(new PopStateEvent('popstate'));

    expect(snapshots.map(({ route }) => route)).toEqual(['home']);
  });

  it('onChange() gives a late subscriber the current snapshot at once', () => {
    router.start();
    const listener = vi.fn();

    router.onChange(listener);

    expect(listener).toHaveBeenCalledWith(router.snapshot);
  });

  describe('beforeNavigate()', () => {
    it('runs before the page is created on start, navigation and Back/Forward', () => {
      const order: string[] = [];
      router.beforeNavigate(() => order.push(`hook (pages: ${pages.length})`));

      router.start();
      router.navigate('library');
      globalThis.dispatchEvent(new PopStateEvent('popstate'));

      expect(order).toEqual(['hook (pages: 0)', 'hook (pages: 1)', 'hook (pages: 2)']);
    });

    it('runs before the listeners (dialogs) see the new snapshot', () => {
      const order: string[] = [];
      router.beforeNavigate(() => order.push('hook'));
      router.onChange(() => order.push('listener'));

      router.start();
      router.updateQuery({ game: 'palia' });

      expect(order).toEqual(['hook', 'listener', 'hook', 'listener']);
    });

    it('can be removed', () => {
      const hook = vi.fn();
      const remove = router.beforeNavigate(hook);

      remove();
      router.start();

      expect(hook).not.toHaveBeenCalled();
    });
  });
});
