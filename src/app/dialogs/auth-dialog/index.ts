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

export class AuthDialog extends DialogBase {
  constructor() {
    super({ className: 'auth-dialog', ariaLabel: 'Sign in or create an account' });
  }

  open(mode: AuthMode = 'login'): void {
    if (this.isOpen) return;

    this.setMode(mode);
    this.show();
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
      this.mountChild(new AuthForm({ config: LOGIN_FORM_CONFIG, onSwitch: () => this.setMode('signup') }), panels);
      this.mountChild(new AuthForm({ config: REGISTER_FORM_CONFIG, onSwitch: () => this.setMode('login') }), panels);
    }

    for (const tab of dialog.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')) {
      tab.addEventListener('click', () => {
        this.setMode(tab.dataset.mode === 'signup' ? 'signup' : 'login');
      });
    }
  }

  private setMode(mode: AuthMode): void {
    if (!this.dialog) return;

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
