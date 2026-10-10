import type { AuthFormConfig } from '@dialogs/auth-dialog/auth-form';
import mailIconUrl from '@assets/icons/mail.svg';
import lockIconUrl from '@assets/icons/lock.svg';
import { emailValidators, loginPasswordValidators, trimValue } from '@dialogs/auth-dialog/auth-validators';

export const LOGIN_FORM_CONFIG: AuthFormConfig = {
  mode: 'login',
  title: 'Welcome Back!',
  subtitle: 'Sign in to resume your games and progress.',
  fields: [
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      autocomplete: 'email',
      placeholder: 'e.g. alex@minigames.com',
      iconUrl: mailIconUrl,
      validators: emailValidators,
      normalize: trimValue,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      autocomplete: 'current-password',
      placeholder: '••••••••',
      iconUrl: lockIconUrl,
      withVisibilityToggle: true,
      validators: loginPasswordValidators,
    },
  ],
  withForgotPassword: true,
  submitLabel: 'Login',
  pendingLabel: 'Logging in…',
  googleLabel: 'Continue with Google',
  footerText: "Don't have an account?",
  switchLabel: 'Register',
};
