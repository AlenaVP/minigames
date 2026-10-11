import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthMode } from '@shared/types/auth';
import { snackbar } from '@shared/ui/snackbar';
import { ALREADY_SIGNED_IN_MESSAGE, DialogCoordinator, type DialogRouter } from './dialog-coordinator';
import type { NavigateOptions, RouteSnapshot } from './router';
import type { QueryPatch } from './router/url';

const snapshotOf = (search: string): RouteSnapshot => ({ route: 'home', query: new URLSearchParams(search) });

/** Records every dialog operation in one list, so the tests can check the ORDER too */
function createFakes() {
  const log: string[] = [];
  let authOpen = false;

  const router = {
    snapshot: snapshotOf('') as RouteSnapshot | null,
    isDialogEntry: false as boolean,
    updateQuery: vi.fn<(patch: QueryPatch, options?: NavigateOptions) => void>(),
    back: vi.fn<() => void>(),
  } satisfies DialogRouter;

  const authDialog = {
    get isOpen() {
      return authOpen;
    },
    open: vi.fn((mode: AuthMode) => {
      authOpen = true;
      log.push(`auth.open(${mode})`);
    }),
    close: vi.fn(() => {
      authOpen = false;
      log.push('auth.close');
    }),
  };

  const gameDetails = {
    open: vi.fn((slug: string) => log.push(`game.open(${slug})`)),
    suspend: vi.fn((slug: string) => log.push(`game.suspend(${slug})`)),
    close: vi.fn(() => log.push('game.close')),
  };

  const session = { ensureActive: vi.fn(() => false) };

  return { log, router, authDialog, gameDetails, session };
}

describe('DialogCoordinator', () => {
  let fakes: ReturnType<typeof createFakes>;
  let coordinator: DialogCoordinator;

  const signIn = (): void => {
    fakes.session.ensureActive.mockReturnValue(true);
  };

  beforeEach(() => {
    fakes = createFakes();
    coordinator = new DialogCoordinator(fakes);
    vi.spyOn(snackbar, 'info');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('sync (URL → dialogs)', () => {
    it('opens Auth on the requested tab for a guest', () => {
      coordinator.sync(snapshotOf('auth=register'));

      expect(fakes.log).toEqual(['game.close', 'auth.open(signup)']);
    });

    it('guards a signed-in user: no Auth, only the auth key removed in place, one toast', () => {
      signIn();

      coordinator.sync(snapshotOf('category=puzzle&auth=login'));

      expect(fakes.authDialog.open).not.toHaveBeenCalled();
      expect(fakes.router.updateQuery).toHaveBeenCalledExactlyOnceWith({ auth: null }, { replace: true });
      expect(snackbar.info).toHaveBeenCalledExactlyOnceWith(ALREADY_SIGNED_IN_MESSAGE);
    });

    it('lets Auth open once the session has been found expired or invalid (that user is a guest)', () => {
      // ensureActive() ends such a session and answers false
      fakes.session.ensureActive.mockReturnValue(false);

      coordinator.sync(snapshotOf('auth=login'));

      expect(fakes.authDialog.open).toHaveBeenCalledWith('login');
      expect(snackbar.info).not.toHaveBeenCalled();
    });

    it('corrects an unknown auth value to login in place, without opening anything yet', () => {
      coordinator.sync(snapshotOf('auth=admin'));

      expect(fakes.router.updateQuery).toHaveBeenCalledWith({ auth: 'login' }, { replace: true });
      expect(fakes.log).toEqual([]);
    });

    it('shows Game Details for ?game=', () => {
      coordinator.sync(snapshotOf('game=tiny-glade'));

      expect(fakes.log).toEqual(['game.open(tiny-glade)']);
    });

    it('puts Auth over a suspended Game Details for ?game=&auth= — the game first steps aside', () => {
      coordinator.sync(snapshotOf('game=tiny-glade'));
      coordinator.sync(snapshotOf('game=tiny-glade&auth=login'));

      expect(fakes.log).toEqual(['game.open(tiny-glade)', 'game.suspend(tiny-glade)', 'auth.open(login)']);
    });

    it('brings Game Details back when Auth goes away — Auth closes first', () => {
      coordinator.sync(snapshotOf('game=tiny-glade&auth=login'));
      fakes.log.length = 0;

      coordinator.sync(snapshotOf('game=tiny-glade'));

      expect(fakes.log).toEqual(['auth.close', 'game.open(tiny-glade)']);
    });

    it('a signed-in user with ?game=&auth= keeps the game: only auth is removed', () => {
      signIn();

      coordinator.sync(snapshotOf('game=tiny-glade&auth=login'));

      expect(fakes.router.updateQuery).toHaveBeenCalledWith({ auth: null }, { replace: true });
      expect(fakes.gameDetails.suspend).not.toHaveBeenCalled();
    });

    it('closes everything when the URL names no dialog', () => {
      coordinator.sync(snapshotOf('auth=login'));
      fakes.log.length = 0;

      coordinator.sync(snapshotOf(''));

      expect(fakes.log).toEqual(['auth.close', 'game.close']);
    });
  });

  describe('actions (→ URL)', () => {
    it('opens Game Details as a new history entry and drops a stray auth key', () => {
      coordinator.openGameDetails('palia');

      expect(fakes.router.updateQuery).toHaveBeenCalledWith({ game: 'palia', auth: null }, { dialog: true });
    });

    it('opens Auth as a new history entry, leaving an open game in the URL', () => {
      coordinator.openAuth('signup');

      expect(fakes.router.updateQuery).toHaveBeenCalledWith({ auth: 'register' }, { dialog: true });
      expect(fakes.router.updateQuery.mock.calls[0]?.[0]).not.toHaveProperty('game');
    });

    it('does not even push an Auth entry for a signed-in user', () => {
      signIn();

      coordinator.openAuth('login');

      expect(fakes.router.updateQuery).not.toHaveBeenCalled();
      expect(snackbar.info).toHaveBeenCalledWith(ALREADY_SIGNED_IN_MESSAGE);
    });

    it('switches the Auth tab in place', () => {
      coordinator.switchAuthMode('signup');

      expect(fakes.router.updateQuery).toHaveBeenCalledWith({ auth: 'register' }, { replace: true });
    });
  });

  describe('handleDialogClosed', () => {
    it('goes Back when the entry was pushed by opening the dialog', () => {
      fakes.router.snapshot = snapshotOf('game=palia&auth=login');
      fakes.router.isDialogEntry = true;

      coordinator.handleDialogClosed('auth');

      expect(fakes.router.back).toHaveBeenCalledOnce();
    });

    it('removes the key in place after a deep link (nothing of ours to go back to)', () => {
      fakes.router.snapshot = snapshotOf('game=palia&auth=login');

      coordinator.handleDialogClosed('auth');

      expect(fakes.router.updateQuery).toHaveBeenCalledWith({ auth: null }, { replace: true });
      expect(fakes.router.back).not.toHaveBeenCalled();
    });

    it('does nothing when the URL itself closed the dialog (Back)', () => {
      fakes.router.snapshot = snapshotOf('game=palia');

      coordinator.handleDialogClosed('auth');

      expect(fakes.router.updateQuery).not.toHaveBeenCalled();
      expect(fakes.router.back).not.toHaveBeenCalled();
    });
  });
});
