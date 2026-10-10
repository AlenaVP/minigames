import { DialogBase } from '@app/core/dialog.base';
import { type AuthProvider, toAuthError } from '@app/services/auth';
import type { FormValues } from '@shared/forms/validators';
import type { AuthMode, AuthUser } from '@shared/types/auth';
import type { AppSession } from '@shared/types/session';
import { snackbar } from '@shared/ui/snackbar';
import { AuthForm } from './auth-form';
import { LOGIN_FORM_CONFIG } from './login-form';
import { REGISTER_FORM_CONFIG } from './register-form';
import './auth-dialog.scss';

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'login', label: 'Login' },
  { mode: 'signup', label: 'Register' },
];

interface AuthDialogOptions {
  authProvider: AuthProvider;
  /** Firebase confirmed the identity: the app creates its session and switches the UI */
  onAuthenticated: (user: AuthUser) => AppSession;
  onClose?: () => void;
  /** The user switched Login ↔ Register inside the dialog (the URL follows: ?auth=register) */
  onModeChange?: (mode: AuthMode) => void;
}

const MESSAGES = {
  welcomeBack: (name: string) => `Welcome back, ${name}!`,
  accountCreated: (name: string) => `Account created. Welcome, ${name}!`,
  displayNameNotSaved: 'Your account was created, but the username could not be saved to your profile.',
} as const;

export class AuthDialog extends DialogBase {
  private readonly options: AuthDialogOptions;
  private readonly forms = new Map<AuthMode, AuthForm>();
  private mode: AuthMode | null = null;
  private isPending = false;
  /** A mode requested (e.g. by Back/Forward) while a request was pending: applied when it finishes */
  private deferredMode: AuthMode | null = null;

  constructor(options: AuthDialogOptions) {
    super({ className: 'auth-dialog', ariaLabel: 'Sign in or create an account', onClose: options.onClose });
    this.options = options;
  }

  /** Idempotent: already open → only the tab follows (Back/Forward between ?auth=login and ?auth=register) */
  open(mode: AuthMode = 'login'): void {
    if (!this.isOpen) this.resetForms();
    this.setMode(mode);
    if (!this.isOpen) this.show();
  }

  protected renderContent(dialog: HTMLDialogElement): void {
    dialog.innerHTML = `
      <div class="auth-dialog__inner">
        <div class="auth-dialog__tabs" role="tablist" aria-label="Authentication mode">
          ${TABS.map(
            ({ mode, label }) => `
            <button
              type="button"
              role="tab"
              id="auth-tab-${mode}"
              class="auth-dialog__tab"
              data-mode="${mode}"
              aria-controls="auth-panel-${mode}"
            >${label}</button>`,
          ).join('')}
        </div>
        <div class="auth-dialog__panels"></div>
      </div>
    `;

    const panels = dialog.querySelector<HTMLElement>('.auth-dialog__panels');

    if (panels) {
      const login = new AuthForm({
        config: LOGIN_FORM_CONFIG,
        onSwitch: () => this.switchMode('signup'),
        onSubmit: (values) => void this.authenticate('login', values),
      });
      const register = new AuthForm({
        config: REGISTER_FORM_CONFIG,
        onSwitch: () => this.switchMode('login'),
        onSubmit: (values) => void this.authenticate('signup', values),
      });
      this.forms.set('login', this.mountChild(login, panels));
      this.forms.set('signup', this.mountChild(register, panels));
    }

    for (const tab of dialog.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')) {
      tab.addEventListener('click', () => {
        this.switchMode(tab.dataset.mode === 'signup' ? 'signup' : 'login');
      });
    }
  }

  /**
   * Submit → Firebase → app session → close. Pending: nothing in the dialog can be pressed, and it cannot be
   * dismissed. Failure: the dialog stays open with the values, controls unlocked, a Snackbar says why.
   */
  private async authenticate(mode: AuthMode, values: FormValues): Promise<void> {
    if (this.isPending) return;
    const { authProvider, onAuthenticated } = this.options;
    const email = values.email ?? '';
    const password = values.password ?? '';

    this.setPending(mode, true);
    let isFirebaseSignedIn = false;
    try {
      if (mode === 'login') {
        const user = await authProvider.signInWithEmail(email, password);
        isFirebaseSignedIn = true;
        const session = onAuthenticated(user);
        snackbar.success(MESSAGES.welcomeBack(session.displayName));
      } else {
        const result = await authProvider.signUpWithEmail(email, password, values.username ?? '');
        isFirebaseSignedIn = true;
        const session = onAuthenticated(result.user);
        snackbar.success(MESSAGES.accountCreated(session.displayName));
        if (!result.isDisplayNameSaved) snackbar.warning(MESSAGES.displayNameNotSaved);
      }

      this.setPending(mode, false);
      this.close();
    } catch (error) {
      // Firebase said yes, but the app could not create its session: do not leave Firebase signed in
      if (isFirebaseSignedIn) authProvider.signOut().catch(() => {});
      this.setPending(mode, false);
      snackbar.error(toAuthError(error).message);
    }
  }

  private setPending(mode: AuthMode, isPending: boolean): void {
    this.isPending = isPending;
    this.setDismissible(!isPending);
    this.forms.get(mode)?.setPending(isPending);

    for (const tab of this.dialog?.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab') ?? []) {
      tab.disabled = isPending;
    }

    if (!isPending && this.deferredMode) {
      const deferred = this.deferredMode;
      this.deferredMode = null;
      this.setMode(deferred);
    }
  }

  private resetForms(): void {
    for (const form of this.forms.values()) form.reset();
  }

  /** A user action: shown at once, and reported so the URL can follow */
  private switchMode(mode: AuthMode): void {
    this.setMode(mode);
    this.options.onModeChange?.(mode);
  }

  private setMode(mode: AuthMode): void {
    if (!this.dialog) return;
    if (this.isPending) {
      this.deferredMode = mode;
      return;
    }

    // 4-1-1: switching Login ↔ Register (tab, link or Back/Forward) starts both forms from scratch
    if (this.mode !== null && this.mode !== mode) this.resetForms();
    this.mode = mode;

    for (const tab of this.dialog.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')) {
      const isActive = tab.dataset.mode === mode;
      tab.setAttribute('aria-selected', String(isActive));
      tab.tabIndex = isActive ? 0 : -1;
    }

    for (const panel of this.dialog.querySelectorAll<HTMLElement>('.auth-form')) {
      panel.hidden = panel.id !== `auth-panel-${mode}`;
    }
  }
}
