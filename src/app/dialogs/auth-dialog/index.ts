import { ComponentBase } from '@app/core/component.base';
import type { AuthMode } from '@shared/types/auth';
import { AuthForm } from './auth-form';
import { LOGIN_FORM_CONFIG } from './login-form';
import { REGISTER_FORM_CONFIG } from './register-form';
import './auth-dialog.scss';

const TABS: { mode: AuthMode; label: string }[] = [
  { mode: 'login', label: 'Login' },
  { mode: 'signup', label: 'Register' },
];

export class AuthDialog extends ComponentBase {
  private dialog: HTMLDialogElement | null = null;
  private pointerDownOnBackdrop = false;

  protected render(): HTMLElement {
    const dialog = document.createElement('dialog');
    dialog.classList.add('auth-dialog');
    dialog.setAttribute('aria-label', 'Sign in or create an account');

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
      new AuthForm({ config: LOGIN_FORM_CONFIG, onSwitch: () => this.setMode('signup') }).mount(panels);
      new AuthForm({ config: REGISTER_FORM_CONFIG, onSwitch: () => this.setMode('login') }).mount(panels);
    }

    this.dialog = dialog;
    this.bindEvents(dialog);
    return dialog;
  }

  open(mode: AuthMode = 'login'): void {
    if (!this.dialog || this.dialog.open) return;

    this.setMode(mode);
    this.dialog.showModal();
  }

  close(): void {
    this.dialog?.close();
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

  private bindEvents(dialog: HTMLDialogElement): void {
    for (const tab of dialog.querySelectorAll<HTMLButtonElement>('.auth-dialog__tab')) {
      tab.addEventListener('click', () => {
        const mode = tab.dataset.mode === 'signup' ? 'signup' : 'login';
        this.setMode(mode);
      });
    }

    // prevent the dialog box from closing unexpectedly
    dialog.addEventListener('pointerdown', (event) => {
      this.pointerDownOnBackdrop = event.target === dialog;
    });

    dialog.addEventListener('click', (event) => {
      if (this.pointerDownOnBackdrop && event.target === dialog) {
        this.close();
      }
    });
  }
}
