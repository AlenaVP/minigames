import { ComponentBase } from '@app/core/component.base';
import type { AuthMode } from '@shared/types/auth';
import googleIconUrl from '@assets/icons/google.svg';
import visibilityIconUrl from '@assets/icons/visibility.svg';
import './auth-form.scss';

export interface AuthFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  autocomplete: string;
  placeholder: string;
  iconUrl: string;
  minLength?: number;
  withVisibilityToggle?: boolean;
}

export interface AuthFormConfig {
  mode: AuthMode;
  title: string;
  subtitle: string;
  fields: AuthFieldConfig[];
  withForgotPassword?: boolean;
  submitLabel: string;
  googleLabel: string;
  footerText: string;
  switchLabel: string;
}

interface AuthFormOptions {
  config: AuthFormConfig;
  onSwitch: () => void;
}

export class AuthForm extends ComponentBase {
  private options: AuthFormOptions;

  constructor(options: AuthFormOptions) {
    super();
    this.options = options;
  }

  protected render(): HTMLElement {
    const { config } = this.options;

    const panel = document.createElement('section');
    panel.classList.add('auth-form');
    panel.id = `auth-panel-${config.mode}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `auth-tab-${config.mode}`);
    panel.hidden = true; // какую панель показать — решает AuthDialog.setMode()

    panel.innerHTML = `
      <header class="auth-form__header">
        <h2 class="auth-form__title">${config.title}</h2>
        <p class="auth-form__subtitle">${config.subtitle}</p>
      </header>

      <form class="auth-form__form" novalidate>
        <div class="auth-form__fields">
          ${config.fields.map((field) => this.renderField(field)).join('')}
          ${config.withForgotPassword ? '<a href="/" class="auth-form__forgot">Forgot Password?</a>' : ''}
        </div>

        <div class="auth-form__actions">
          <button type="submit" class="auth-form__submit">${config.submitLabel}</button>
          <p class="auth-form__divider">or</p>
          <button type="button" class="auth-form__google">
            <img src="${googleIconUrl}" alt="" width="24" height="24" />
            ${config.googleLabel}
          </button>
        </div>
      </form>

      <p class="auth-form__footer">
        ${config.footerText}
        <button type="button" class="auth-form__switch">${config.switchLabel}</button>
      </p>
    `;

    this.bindEvents(panel);
    return panel;
  }

  private renderField(field: AuthFieldConfig): string {
    const id = `${this.options.config.mode}-${field.name}`;
    const minLength = field.minLength ? `minlength="${field.minLength}"` : '';
    const toggle = field.withVisibilityToggle
      ? `<button type="button" class="auth-field__toggle" aria-label="Show password">
           <img src="${visibilityIconUrl}" alt="" width="20" height="20" />
         </button>`
      : '';

    return `
      <div class="auth-field">
        <label for="${id}" class="auth-field__label">${field.label}</label>
        <div class="auth-field__control">
          <img src="${field.iconUrl}" alt="" width="20" height="20" class="auth-field__icon" />
          <input
            id="${id}"
            name="${field.name}"
            type="${field.type}"
            class="auth-field__input"
            placeholder="${field.placeholder}"
            autocomplete="${field.autocomplete}"
            required
            ${minLength}
          />
          ${toggle}
        </div>
      </div>
    `;
  }

  private bindEvents(panel: HTMLElement): void {
    panel.querySelector('.auth-form__switch')?.addEventListener('click', () => this.options.onSwitch());

    // prevents page auto reloading
    panel.querySelector('form')?.addEventListener('submit', (event) => event.preventDefault());
  }
}
