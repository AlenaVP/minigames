import type { AuthFormConfig } from '@dialogs/auth-dialog/auth-form';
import mailIconUrl from '@assets/icons/mail.svg';
import lockIconUrl from '@assets/icons/lock.svg';

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
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      autocomplete: 'current-password',
      placeholder: '••••••••',
      iconUrl: lockIconUrl,
      withVisibilityToggle: true,
    },
  ],
  withForgotPassword: true,
  submitLabel: 'Login',
  googleLabel: 'Continue with Google',
  footerText: "Don't have an account?",
  switchLabel: 'Register',
};
