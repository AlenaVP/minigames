import { ComponentBase } from '@app/core/component.base';
import { FormModel } from '@shared/forms/form-model';
import type { FormValues, Validator } from '@shared/forms/validators';
import type { AuthMode } from '@shared/types/auth';
import { snackbar } from '@shared/ui/snackbar';
import googleIconUrl from '@assets/icons/google.svg';
import visibilityIconUrl from '@assets/icons/visibility.svg';
import visibilityOffIconUrl from '@assets/icons/visibility-off.svg';
import './auth-form.scss';

export interface AuthFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'password';
  autocomplete: string;
  placeholder: string;
  iconUrl: string;
  validators: readonly Validator[];
  normalize?: (value: string) => string;
  withVisibilityToggle?: boolean;
}

export interface AuthFormConfig {
  mode: AuthMode;
  title: string;
  subtitle: string;
  fields: AuthFieldConfig[];
  withForgotPassword?: boolean;
  submitLabel: string;
  /** Shown on the submit button while the request is pending */
  pendingLabel: string;
  googleLabel: string;
  footerText: string;
  switchLabel: string;
}

interface AuthFormOptions {
  config: AuthFormConfig;
  onSwitch: () => void;
  /** A valid form was submitted: normalized values (trimmed email) */
  onSubmit?: (values: FormValues) => void;
}

const TOGGLE_LABEL = { show: 'Show password', hide: 'Hide password' } as const;
const FORGOT_PASSWORD_MESSAGE = 'Password recovery is not available yet.';

export class AuthForm extends ComponentBase {
  private readonly options: AuthFormOptions;
  private readonly model: FormModel<string>;
  private form: HTMLFormElement | null = null;
  private isPointerDown = false;
  private hasDeferredRender = false;
  private isPending = false;
  private focusBeforePending: HTMLElement | null = null;

  constructor(options: AuthFormOptions) {
    super();
    this.options = options;
    this.model = new FormModel(
      Object.fromEntries(options.config.fields.map(({ name, validators, normalize }) => [name, { validators, normalize }])),
    );
  }

  get isValid(): boolean {
    return this.model.isValid;
  }

  /**
   * While Firebase works: every input and button of the form (incl. Google, eye, Forgot password) and the
   * Login ↔ Register link are disabled, the submit button shows a spinner. Afterwards focus goes back
   * where it was, so a keyboard user can simply press Enter again after a failure.
   */
  setPending(isPending: boolean): void {
    const form = this.form;
    if (!form || this.isPending === isPending) return;

    if (isPending) {
      const active = document.activeElement;
      this.focusBeforePending = active instanceof HTMLElement && form.contains(active) ? active : null;
    }

    this.isPending = isPending;
    form.setAttribute('aria-busy', String(isPending));

    for (const control of form.elements) {
      if (control instanceof HTMLInputElement || control instanceof HTMLButtonElement) control.disabled = isPending;
    }
    const switchButton = form.parentElement?.querySelector<HTMLButtonElement>('.auth-form__switch');
    if (switchButton) switchButton.disabled = isPending;

    const submit = form.querySelector<HTMLButtonElement>('.auth-form__submit');
    if (submit) {
      submit.classList.toggle('auth-form__submit--pending', isPending);
      const label = submit.querySelector('.auth-form__submit-label');
      if (label) label.textContent = isPending ? this.options.config.pendingLabel : this.options.config.submitLabel;
    }

    this.renderValidation();

    if (!isPending) {
      this.focusBeforePending?.focus();
      this.focusBeforePending = null;
    }
  }

  /** Empty fields, no errors, password hidden — on every Login ↔ Register switch and every new opening */
  reset(): void {
    this.form?.reset();
    this.model.reset();
    this.setPasswordVisible(false);
    this.renderValidation();
  }

  protected render(): HTMLElement {
    const { config } = this.options;

    const panel = document.createElement('section');
    panel.classList.add('auth-form');
    panel.id = `auth-panel-${config.mode}`;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('aria-labelledby', `auth-tab-${config.mode}`);
    panel.hidden = true;

    panel.innerHTML = `
      <header class="auth-form__header">
        <h2 class="auth-form__title">${config.title}</h2>
        <p class="auth-form__subtitle">${config.subtitle}</p>
      </header>

      <form class="auth-form__form" novalidate>
        <div class="auth-form__fields">
          ${config.fields.map((field) => this.renderField(field)).join('')}
          ${config.withForgotPassword ? '<button type="button" class="auth-form__forgot">Forgot Password?</button>' : ''}
        </div>

        <div class="auth-form__actions">
          <button type="submit" class="auth-form__submit" disabled>
            <span class="auth-form__submit-label">${config.submitLabel}</span>
          </button>
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

    this.form = panel.querySelector('form');
    this.setFieldIcons();
    this.bindEvents(panel);
    return panel;
  }

  /**
   * Set through the DOM, not in the HTML string: Vite inlines small SVGs as data URIs full of quotes,
   * which would break a quoted style="…" attribute.
   */
  private setFieldIcons(): void {
    for (const { name, iconUrl } of this.options.config.fields) {
      const icon = this.form
        ?.querySelector<HTMLElement>(`#${this.fieldId(name)}`)
        ?.parentElement?.querySelector<HTMLElement>('.auth-field__icon');
      icon?.style.setProperty('--icon', `url(${JSON.stringify(iconUrl)})`);
    }
  }

  private fieldId(name: string): string {
    return `${this.options.config.mode}-${name}`;
  }

  private renderField(field: AuthFieldConfig): string {
    const id = this.fieldId(field.name);
    const toggle = field.withVisibilityToggle
      ? `<button type="button" class="auth-field__toggle" aria-controls="${id}" aria-label="${TOGGLE_LABEL.show}">
           <img src="${visibilityIconUrl}" alt="" width="20" height="20" />
         </button>`
      : '';

    // The icon is a CSS mask (not an <img>), so its color follows the field state: red in the error state (Guidebook).
    // The error <p> is always in the DOM (hidden while empty): aria-describedby never points to a missing id
    return `
      <div class="auth-field">
        <label for="${id}" class="auth-field__label">${field.label}</label>
        <div class="auth-field__control">
          <span class="auth-field__icon" aria-hidden="true"></span>
          <input
            id="${id}"
            name="${field.name}"
            type="${field.type}"
            class="auth-field__input"
            placeholder="${field.placeholder}"
            autocomplete="${field.autocomplete}"
            aria-describedby="${id}-error"
            required
          />
          ${toggle}
        </div>
        <p id="${id}-error" class="auth-field__error" hidden></p>
      </div>
    `;
  }

  private bindEvents(panel: HTMLElement): void {
    const form = this.form;
    if (!form) return;

    panel.querySelector('.auth-form__switch')?.addEventListener('click', () => this.options.onSwitch());
    panel.querySelector('.auth-field__toggle')?.addEventListener('click', () => this.togglePasswordVisibility());
    panel.querySelector('.auth-form__forgot')?.addEventListener('click', () => snackbar.info(FORGOT_PASSWORD_MESSAGE));

    // input: every keystroke and paste; change: autofill in some browsers; focusout: the user left a field
    const onValueChange = (event: Event): void => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !this.model.has(input.name)) return;

      this.model.setValue(input.name, input.value);
      this.renderValidation();
    };

    form.addEventListener('input', onValueChange);
    form.addEventListener('change', onValueChange);
    form.addEventListener('focusout', (event) => {
      const input = event.target;
      if (!(input instanceof HTMLInputElement) || !this.model.has(input.name)) return;

      this.model.markTouched(input.name);

      // Focus left because a button/tab is being pressed: an error appearing NOW would push that button down
      // before the mouse is released, and the click would be lost. Show it once the press is over.
      if (this.isPointerDown) this.hasDeferredRender = true;
      else this.renderValidation();
    });

    this.trackPointerPress();

    form.addEventListener('submit', (event) => {
      event.preventDefault();
      if (this.isPending) return;

      if (this.model.isValid) {
        this.options.onSubmit?.(this.model.values());
        return;
      }

      // Submit is disabled while invalid; this only runs if something bypassed it (e.g. DevTools)
      this.model.markAllTouched();
      this.renderValidation();
      form.querySelector<HTMLInputElement>('[aria-invalid="true"]')?.focus();
    });
  }

  /**
   * pointerdown → (focusout) → pointerup → click all belong to one press. The deferred errors are rendered
   * in the next task, i.e. after the click has reached its button.
   */
  private trackPointerPress(): void {
    const options = { capture: true, signal: this.destroySignal };

    document.addEventListener(
      'pointerdown',
      () => {
        this.isPointerDown = true;
      },
      options,
    );

    const release = (): void => {
      this.isPointerDown = false;
      if (!this.hasDeferredRender) return;

      this.hasDeferredRender = false;
      setTimeout(() => this.renderValidation());
    };

    document.addEventListener('pointerup', release, options);
    document.addEventListener('pointercancel', release, options);
  }

  /** Model → DOM: inline errors, aria-invalid, the submit button */
  private renderValidation(): void {
    const form = this.form;
    if (!form) return;

    for (const name of this.model.fieldNames) {
      const error = this.model.getVisibleError(name);
      const input = form.querySelector<HTMLInputElement>(`#${this.fieldId(name)}`);
      const message = form.querySelector<HTMLElement>(`#${this.fieldId(name)}-error`);

      if (error === null) input?.removeAttribute('aria-invalid');
      else input?.setAttribute('aria-invalid', 'true');

      if (message) {
        message.textContent = error ?? '';
        message.hidden = error === null;
      }
    }

    const submit = form.querySelector<HTMLButtonElement>('.auth-form__submit');
    if (submit) submit.disabled = this.isPending || !this.model.isValid;
  }

  private togglePasswordVisibility(): void {
    const input = this.getToggledInput();
    if (input) this.setPasswordVisible(input.type === 'password');
  }

  private getToggledInput(): HTMLInputElement | null {
    const id = this.form?.querySelector('.auth-field__toggle')?.getAttribute('aria-controls');
    return id ? (this.form?.querySelector<HTMLInputElement>(`#${id}`) ?? null) : null;
  }

  private setPasswordVisible(isVisible: boolean): void {
    const toggle = this.form?.querySelector<HTMLButtonElement>('.auth-field__toggle');
    const input = this.getToggledInput();
    if (!toggle || !input) return;

    // The label (not aria-pressed) tells the state: "Show password" ↔ "Hide password"
    input.type = isVisible ? 'text' : 'password';
    toggle.setAttribute('aria-label', isVisible ? TOGGLE_LABEL.hide : TOGGLE_LABEL.show);
    toggle.querySelector('img')?.setAttribute('src', isVisible ? visibilityOffIconUrl : visibilityIconUrl);
  }
}
