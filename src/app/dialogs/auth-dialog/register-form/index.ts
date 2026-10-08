import type { AuthFormConfig } from '@dialogs/auth-dialog/auth-form';
import personIconUrl from '@assets/icons/person.svg';
import mailIconUrl from '@assets/icons/mail.svg';
import lockIconUrl from '@assets/icons/lock.svg';
import {
  confirmPasswordValidators,
  emailValidators,
  registerPasswordValidators,
  trimValue,
  usernameValidators,
} from '@dialogs/auth-dialog/auth-validators';

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
      placeholder: 'e.g. CozyGamer99',
      iconUrl: personIconUrl,
      validators: usernameValidators,
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      autocomplete: 'email',
      placeholder: 'your.email@domain.com',
      iconUrl: mailIconUrl,
      validators: emailValidators,
      normalize: trimValue,
    },
    {
      name: 'password',
      label: 'Password',
      type: 'password',
      autocomplete: 'new-password',
      placeholder: 'Min. 6 characters',
      iconUrl: lockIconUrl,
      validators: registerPasswordValidators,
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      type: 'password',
      autocomplete: 'new-password',
      placeholder: 'Repeat your password',
      iconUrl: lockIconUrl,
      validators: confirmPasswordValidators('password'),
    },
  ],
  submitLabel: 'Create Account',
  googleLabel: 'Sign up with Google',
  footerText: 'Already have an account?',
  switchLabel: 'Login',
};
