import { ComponentBase } from '@app/core/component.base';
import { getMutationOutcome, isAbortedRequest } from '@app/core/http';
import { gamesApi } from '@app/services/api';
import { heartOutlineIcon } from '@shared/ui/icons';
import { snackbar } from '@shared/ui/snackbar';
import type { AppSession } from '@shared/types/session';
import type { GameDetailsAccess } from './game-details-access';

interface FavoriteButtonOptions {
  slug: string;
  /** From the game response… */
  isFavorited: boolean;
  /** …which was requested with this email (null = as a guest): tells whether isFavorited is about the current user */
  loadedFor: string | null;
  access: GameDetailsAccess;
  /** The server's new favorites count for the game (shown next to the rating) */
  onLikesCount: (count: number) => void;
}

const LABEL = { off: 'Add to Favorites', on: 'Remove from Favorites' } as const;

export const FAVORITE_MESSAGES = {
  signIn: 'Sign in to add games to your favorites.',
  added: 'Added to favorites.',
  removed: 'Removed from favorites.',
  rejected: (reason: string) => `Couldn't update favorites. ${reason}`,
  unknown: "Couldn't confirm the change to favorites. Checking the current state…",
  loadFailed: (reason: string) => `Couldn't load your favorites. ${reason}`,
} as const;

/**
 * "Add to / Remove from Favorites" (RSS-QS-4-2-1). The state always comes from the server:
 * the personal game response at first, then each toggle's answer — never a local guess.
 *
 *   guest / expired → no request: Auth over the game (+ one toast)
 *   signed in       → locked with a spinner → POST → state + count from the answer
 *     rejected      → error toast, state unchanged, the user may try again
 *     unknown       → NOT repeated (a toggle would undo itself): warning + a safe GET of the real state
 *   sign-in / logout / expiration while open → reloaded for the new user / reset to the guest state
 */
export class FavoriteButton extends ComponentBase {
  private readonly options: FavoriteButtonOptions;
  private isFavorited: boolean;
  /** Whose state is shown (email), null = guest */
  private owner: string | null;
  private isPending = false;
  /** Bumped by every session change: answers to requests made for an earlier user are dropped */
  private generation = 0;

  constructor(options: FavoriteButtonOptions) {
    super();
    this.options = options;
    this.isFavorited = options.loadedFor === null ? false : options.isFavorited;
    this.owner = options.loadedFor;
  }

  mount(parent: HTMLElement): void {
    super.mount(parent);
    this.options.access.session.onChange(({ session }) => this.followSession(session), this.destroySignal);
  }

  protected render(): HTMLElement {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'game-info__action game-info__action--favorite';
    button.innerHTML = `${heartOutlineIcon()}<span class="game-info__favorite-label"></span>`;
    button.addEventListener('click', () => void this.handleClick());
    this.paint(button);
    return button;
  }

  private async handleClick(): Promise<void> {
    if (this.isPending) return;

    const { session, requestAuth } = this.options.access;
    const hadSession = session.current !== null;

    // RSS-QS-4-3-2: checked right before the request; an expired session has just shown its own (single) toast
    if (!session.ensureActive() || !session.current) {
      if (!hadSession) snackbar.warning(FAVORITE_MESSAGES.signIn);
      requestAuth();
      return;
    }

    await this.toggle(session.current.email);
  }

  private async toggle(email: string): Promise<void> {
    const generation = this.generation;
    const restoreFocus = this.lock();

    try {
      const state = await gamesApi.toggleFavorite(this.options.slug, email, this.destroySignal);
      if (generation !== this.generation) return;

      this.setFavorited(state.isFavorited);
      this.options.onLikesCount(state.likesCount);
      snackbar.success(state.isFavorited ? FAVORITE_MESSAGES.added : FAVORITE_MESSAGES.removed);
    } catch (error) {
      if (isAbortedRequest(error) || generation !== this.generation) return;

      if (getMutationOutcome(error) === 'rejected') {
        snackbar.error(FAVORITE_MESSAGES.rejected(error instanceof Error ? error.message : ''));
      } else {
        snackbar.warning(FAVORITE_MESSAGES.unknown);
        await this.reload(email, generation);
      }
    } finally {
      if (generation === this.generation) this.unlock(restoreFocus);
    }
  }

  /** Signed in as someone else, or signed out: the shown state belongs to the previous user */
  private followSession(session: AppSession | null): void {
    const email = session?.email ?? null;
    if (email === this.owner) return;

    this.generation += 1;
    this.owner = email;
    this.unlock(false);

    if (email === null) {
      this.setFavorited(false);
      return;
    }

    const generation = this.generation;
    const restoreFocus = this.lock();
    void this.reload(email, generation).finally(() => {
      if (generation === this.generation) this.unlock(restoreFocus);
    });
  }

  /** GET is safe to repeat: the real state after an unknown outcome or for a user who just signed in */
  private async reload(email: string, generation: number): Promise<void> {
    try {
      const game = await gamesApi.getGame(this.options.slug, { userEmail: email }, this.destroySignal);
      if (generation !== this.generation) return;

      this.setFavorited(game.isLikedByCurrentUser);
      this.options.onLikesCount(game.likesCount);
    } catch (error) {
      if (isAbortedRequest(error) || generation !== this.generation) return;
      snackbar.error(FAVORITE_MESSAGES.loadFailed(error instanceof Error ? error.message : ''));
    }
  }

  /** Locked while a request is out: no duplicate toggles. Returns whether the button had the focus */
  private lock(): boolean {
    const button = this.element;
    const hadFocus = button !== null && document.activeElement === button;
    this.isPending = true;
    if (button instanceof HTMLButtonElement) {
      button.disabled = true;
      button.classList.add('game-info__action--pending');
      button.setAttribute('aria-busy', 'true');
    }
    return hadFocus;
  }

  /** A disabled button drops the focus to <body>: it goes back where the keyboard user left it */
  private unlock(restoreFocus: boolean): void {
    const button = this.element;
    this.isPending = false;
    if (!(button instanceof HTMLButtonElement)) return;

    button.disabled = false;
    button.classList.remove('game-info__action--pending');
    button.removeAttribute('aria-busy');
    if (restoreFocus && (document.activeElement === document.body || document.activeElement === null)) button.focus();
  }

  private setFavorited(isFavorited: boolean): void {
    this.isFavorited = isFavorited;
    if (this.element) this.paint(this.element);
  }

  /**
   * The visible text itself says what the button will do ("Add…" / "Remove…"),
   * so no aria-pressed: a changing label + pressed state would be a double, contradicting signal.
   * On mobile the text is only visually hidden → it is still the accessible name of the icon button.
   */
  private paint(button: HTMLElement): void {
    button.classList.toggle('game-info__action--favorite-active', this.isFavorited);
    const label = button.querySelector('.game-info__favorite-label');
    if (label) label.textContent = this.isFavorited ? LABEL.on : LABEL.off;
  }
}
