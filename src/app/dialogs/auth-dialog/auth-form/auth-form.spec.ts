// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MESSAGES } from '../auth-validators';
import { LOGIN_FORM_CONFIG } from '../login-form';
import { REGISTER_FORM_CONFIG } from '../register-form';
import { AuthForm, type AuthFormConfig } from '.';

function mountForm(config: AuthFormConfig, onSwitch = vi.fn()): { form: AuthForm; panel: HTMLElement } {
  const form = new AuthForm({ config, onSwitch });
  form.mount(document.body);
  const panel = document.body.querySelector<HTMLElement>('.auth-form');
  if (!panel) throw new Error('Auth form was not rendered');
  panel.hidden = false;
  return { form, panel };
}

function field(panel: HTMLElement, name: string): HTMLInputElement {
  const input = panel.querySelector('form')?.elements.namedItem(name);
  if (!(input instanceof HTMLInputElement)) throw new Error(`No field "${name}"`);
  return input;
}

function type(input: HTMLInputElement, value: string): void {
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function leave(input: HTMLInputElement): void {
  input.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

function errorOf(panel: HTMLElement, input: HTMLInputElement): HTMLElement {
  const message = panel.querySelector<HTMLElement>(`#${input.getAttribute('aria-describedby')}`);
  if (!message) throw new Error(`No error element for "${input.name}"`);
  return message;
}

function submitButton(panel: HTMLElement): HTMLButtonElement {
  const button = panel.querySelector<HTMLButtonElement>('.auth-form__submit');
  if (!button) throw new Error('No submit button');
  return button;
}

describe('AuthForm — login', () => {
  let form: AuthForm;
  let panel: HTMLElement;

  beforeEach(() => {
    ({ form, panel } = mountForm(LOGIN_FORM_CONFIG));
  });

  afterEach(() => {
    form.destroy();
  });

  it('gives every field its icon as a CSS mask (so the error state can recolor it)', () => {
    const icons = [...panel.querySelectorAll<HTMLElement>('.auth-field__icon')];

    expect(icons).toHaveLength(LOGIN_FORM_CONFIG.fields.length);
    for (const [index, icon] of icons.entries()) {
      expect(icon.style.getPropertyValue('--icon')).toBe(`url(${JSON.stringify(LOGIN_FORM_CONFIG.fields[index]?.iconUrl)})`);
    }
  });

  it('starts with the submit button disabled and no visible errors', () => {
    expect(submitButton(panel).disabled).toBe(true);
    expect(panel.querySelectorAll('.auth-field__error:not([hidden])')).toHaveLength(0);
  });

  it('shows an inline error while typing an invalid email and links it to the input', () => {
    const email = field(panel, 'email');

    type(email, 'alex@');

    const message = errorOf(panel, email);
    expect(message.hidden).toBe(false);
    expect(message.textContent).toBe(MESSAGES.emailInvalid);
    expect(email.getAttribute('aria-invalid')).toBe('true');
  });

  it('clears the error as soon as the value becomes valid', () => {
    const email = field(panel, 'email');

    type(email, 'alex@');
    type(email, 'alex@minigames.com');

    expect(errorOf(panel, email).hidden).toBe(true);
    expect(email.hasAttribute('aria-invalid')).toBe(false);
  });

  it('shows "required" when the user leaves an empty field', () => {
    const password = field(panel, 'password');

    leave(password);

    expect(errorOf(panel, password).textContent).toBe(MESSAGES.passwordRequired);
  });

  it('enables submit only when every field is valid, and disables it again when one breaks', () => {
    type(field(panel, 'email'), 'alex@minigames.com');
    expect(submitButton(panel).disabled).toBe(true);

    type(field(panel, 'password'), 'abcdef');
    expect(submitButton(panel).disabled).toBe(false);
    expect(form.isValid).toBe(true);

    type(field(panel, 'password'), 'abc');
    expect(submitButton(panel).disabled).toBe(true);
  });

  it('does not apply the registration strength rules to the login password', () => {
    type(field(panel, 'password'), 'abcdef');
    expect(errorOf(panel, field(panel, 'password')).hidden).toBe(true);
  });

  it('a submit that bypassed the disabled button reveals every error and focuses the first one', () => {
    const formElement = panel.querySelector('form');
    const event = new Event('submit', { cancelable: true });

    formElement?.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(errorOf(panel, field(panel, 'email')).textContent).toBe(MESSAGES.emailRequired);
    expect(errorOf(panel, field(panel, 'password')).textContent).toBe(MESSAGES.passwordRequired);
    expect(document.activeElement).toBe(field(panel, 'email'));
  });

  it('shows and hides the password with the eye button', () => {
    const password = field(panel, 'password');
    const toggle = panel.querySelector<HTMLButtonElement>('.auth-field__toggle');

    toggle?.click();
    expect(password.type).toBe('text');
    expect(toggle?.getAttribute('aria-label')).toBe('Hide password');

    toggle?.click();
    expect(password.type).toBe('password');
    expect(toggle?.getAttribute('aria-label')).toBe('Show password');
  });

  it('reset() empties the fields, hides the errors, hides the password and disables submit', () => {
    const email = field(panel, 'email');
    const password = field(panel, 'password');
    type(email, 'alex@');
    type(password, 'abcdef');
    panel.querySelector<HTMLButtonElement>('.auth-field__toggle')?.click();

    form.reset();

    expect(email.value).toBe('');
    expect(password.value).toBe('');
    expect(password.type).toBe('password');
    expect(errorOf(panel, email).hidden).toBe(true);
    expect(submitButton(panel).disabled).toBe(true);
  });

  it('asks the dialog to switch mode from the footer link', () => {
    form.destroy();
    const onSwitch = vi.fn();
    ({ form, panel } = mountForm(LOGIN_FORM_CONFIG, onSwitch));

    panel.querySelector<HTMLButtonElement>('.auth-form__switch')?.click();

    expect(onSwitch).toHaveBeenCalledTimes(1);
  });
});

describe('AuthForm — registration', () => {
  let form: AuthForm;
  let panel: HTMLElement;

  beforeEach(() => {
    ({ form, panel } = mountForm(REGISTER_FORM_CONFIG));
  });

  afterEach(() => {
    form.destroy();
  });

  function fillValid(): void {
    type(field(panel, 'username'), 'CozyGamer99');
    type(field(panel, 'email'), 'cozy@minigames.com');
    type(field(panel, 'password'), 'Abc12!');
    type(field(panel, 'confirmPassword'), 'Abc12!');
  }

  it('enables submit for a fully valid registration', () => {
    fillValid();
    expect(submitButton(panel).disabled).toBe(false);
  });

  it('revalidates the confirmation when the password changes afterwards', () => {
    fillValid();
    const confirm = field(panel, 'confirmPassword');

    type(field(panel, 'password'), 'Abc12!x');

    expect(errorOf(panel, confirm).textContent).toBe(MESSAGES.confirmMismatch);
    expect(submitButton(panel).disabled).toBe(true);

    type(field(panel, 'password'), 'Abc12!');
    expect(errorOf(panel, confirm).hidden).toBe(true);
  });

  it('names what the password still lacks', () => {
    const password = field(panel, 'password');

    type(password, 'abcdef');

    expect(errorOf(panel, password).textContent).toBe(
      'Password needs an uppercase letter, a digit and a special character (e.g. !@#$)',
    );
  });

  it('rejects a username with an underscore (the old placeholder) and shows the new placeholder', () => {
    const username = field(panel, 'username');

    type(username, 'CozyGamer_99');

    expect(errorOf(panel, username).textContent).toBe(MESSAGES.usernameCharacters);
    expect(username.placeholder).toBe('e.g. CozyGamer99');
  });

  it('accepts an email with spaces around it (trimmed before validation)', () => {
    const email = field(panel, 'email');

    type(email, '  cozy@minigames.com ');

    expect(errorOf(panel, email).hidden).toBe(true);
  });
});

describe('AuthForm — errors revealed by leaving a field', () => {
  let form: AuthForm;
  let panel: HTMLElement;

  beforeEach(() => {
    ({ form, panel } = mountForm(LOGIN_FORM_CONFIG));
  });

  afterEach(() => {
    form.destroy();
  });

  it('waits until a mouse press is over, so the pressed button is not pushed away before the click', async () => {
    const email = field(panel, 'email');

    // The user presses "Forgot Password?" while the empty email field is focused
    document.dispatchEvent(new PointerEvent('pointerdown'));
    leave(email);
    expect(errorOf(panel, email).hidden).toBe(true);

    document.dispatchEvent(new PointerEvent('pointerup'));
    expect(errorOf(panel, email).hidden).toBe(true);

    // …the click is handled in the same task; the error appears right after it
    await new Promise((resolve) => setTimeout(resolve));
    expect(errorOf(panel, email).textContent).toBe(MESSAGES.emailRequired);
  });

  it('shows the error immediately when the field is left with the keyboard (Tab)', () => {
    const email = field(panel, 'email');

    leave(email);

    expect(errorOf(panel, email).hidden).toBe(false);
  });
});
