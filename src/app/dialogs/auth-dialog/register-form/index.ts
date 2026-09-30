import type { AuthFormConfig } from '@dialogs/auth-dialog/auth-form';
import personIconUrl from '@assets/icons/person.svg';
import mailIconUrl from '@assets/icons/mail.svg';
import lockIconUrl from '@assets/icons/lock.svg';

export const REGISTER_FORM_CONFIG: AuthFormConfig = {
  mode: 'signup',
  title: 'Create Account',
  subtitle: 'Join MiniGames to track your score & streak.',
  fields: [
    {
      name: 'username',
      label: 'Username',
      type: 'text',
      autocomplete: 'username',
      placeholder: 'e.g. CozyGamer_99',
      iconUrl: personIconUrl,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      autocomplete: 'email',
      placeholder: 'your.email@domain.com',
      iconUrl: mailIconUrl,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      autocomplete: 'new-password',
      placeholder: 'Min. 8 characters',
      iconUrl: lockIconUrl,
      minLength: 8,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      autocomplete: 'new-password',
      placeholder: 'Repeat your password',
      iconUrl: lockIconUrl,
      minLength: 8,
    },
  ],
  submitLabel: 'Create Account',
  googleLabel: 'Sign up with Google',
  footerText: 'Already have an account?',
  switchLabel: 'Login',
};
