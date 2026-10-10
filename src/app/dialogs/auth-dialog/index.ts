import { DialogBase } from '@app/core/dialog.base';
import type { AuthMode } from '@shared/types/auth';
import { AuthForm } from './auth-form';
import { LOGIN_FORM_CONFIG } from './login-form';
import { REGISTER_FORM_CONFIG } from './register-form';
import './auth-dialog.scss';

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'login', label: 'Login' },
  { mode: 'signup', label: 'Register' },
];

interface AuthDialogOptions {
  onClose?: () => void;
  /** The user switched Login ↔ Register inside the dialog (the URL follows: ?auth=register) */
  onModeChange?: (mode: AuthMode) => void;
}

export class AuthDialog extends DialogBase {
  private readonly onModeChange?: (mode: AuthMode) => void;
  private readonly forms: AuthForm[] = [];
  private mode: AuthMode | null = null;

  constructor({ onClose, onModeChange }: AuthDialogOptions = {}) {
    super({ className: 'auth-dialog', ariaLabel: 'Sign in or create an account', onClose });
    this.onModeChange = onModeChange;
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
      this.forms.push(
        this.mountChild(new AuthForm({ config: LOGIN_FORM_CONFIG, onSwitch: () => this.switchMode('signup') }), panels),
        this.mountChild(new AuthForm({ config: REGISTER_FORM_CONFIG, onSwitch: () => this.switchMode('login') }), panels),
      );
    }

    for (const tab of dialog.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')) {
      tab.addEventListener('click', () => {
        this.switchMode(tab.dataset.mode === 'signup' ? 'signup' : 'login');
      });
    }
  }

  private resetForms(): void {
    for (const form of this.forms) form.reset();
  }

  /** A user action: shown at once, and reported so the URL can follow */
  private switchMode(mode: AuthMode): void {
    this.setMode(mode);
    this.onModeChange?.(mode);
  }

  private setMode(mode: AuthMode): void {
    if (!this.dialog) return;

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
