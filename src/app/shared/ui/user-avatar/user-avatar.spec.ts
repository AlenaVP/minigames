// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { UserAvatar } from '.';

const PHOTO_URL = 'https://lh3.googleusercontent.com/a/alex.jpg';

function mountAvatar(avatar = new UserAvatar()): HTMLElement {
  avatar.mount(document.body);
  const element = document.body.querySelector<HTMLElement>('.user-avatar');
  if (!element) throw new Error('The avatar was not rendered');
  return element;
}

const photoOf = (avatar: HTMLElement): HTMLImageElement | null => avatar.querySelector('img');

describe('UserAvatar', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('is decorative: the name is written next to it', () => {
    expect(mountAvatar().getAttribute('aria-hidden')).toBe('true');
  });

  it('shows the initials when there is no photo', () => {
    const avatar = new UserAvatar();
    avatar.setProfile({ name: 'John Doe' });
    const element = mountAvatar(avatar);

    expect(element.textContent).toBe('JD');
    expect(photoOf(element)).toBeNull();
    expect(element.classList.contains('user-avatar--placeholder')).toBe(false);
  });

  it('lays the photo over the initials, without alt text and without sending the Referer', () => {
    const avatar = new UserAvatar();
    const element = mountAvatar(avatar);
    avatar.setProfile({ name: 'John Doe', photoUrl: PHOTO_URL });

    const photo = photoOf(element);
    expect(photo?.getAttribute('src')).toBe(PHOTO_URL);
    expect(photo?.getAttribute('alt')).toBe('');
    expect(photo?.referrerPolicy).toBe('no-referrer');
    expect(element.textContent).toBe('JD');
  });

  it('falls back to the initials when the photo fails, and does not request it again on the next repaint', () => {
    const avatar = new UserAvatar();
    const element = mountAvatar(avatar);
    avatar.setProfile({ name: 'John Doe', photoUrl: PHOTO_URL });

    photoOf(element)?.dispatchEvent(new Event('error'));
    expect(photoOf(element)).toBeNull();
    expect(element.textContent).toBe('JD');

    avatar.setProfile({ name: 'John Doe', photoUrl: PHOTO_URL });
    expect(photoOf(element)).toBeNull();
  });

  it('still tries a different photo after one has failed', () => {
    const avatar = new UserAvatar();
    const element = mountAvatar(avatar);
    avatar.setProfile({ name: 'John Doe', photoUrl: PHOTO_URL });
    photoOf(element)?.dispatchEvent(new Event('error'));

    avatar.setProfile({ name: 'John Doe', photoUrl: `${PHOTO_URL}?v=2` });
    expect(photoOf(element)?.getAttribute('src')).toBe(`${PHOTO_URL}?v=2`);
  });

  it('draws the generic icon when the name has no letter or digit, and for nobody at all', () => {
    const avatar = new UserAvatar();
    const element = mountAvatar(avatar);

    avatar.setProfile({ name: '🙂' });
    expect(element.classList.contains('user-avatar--placeholder')).toBe(true);
    expect(element.textContent).toBe('');

    avatar.setProfile({ name: 'Alena' });
    expect(element.classList.contains('user-avatar--placeholder')).toBe(false);

    avatar.setProfile(null);
    expect(element.classList.contains('user-avatar--placeholder')).toBe(true);
  });

  it('removes the old photo when the profile changes to one without a photo', () => {
    const avatar = new UserAvatar();
    const element = mountAvatar(avatar);
    avatar.setProfile({ name: 'John Doe', photoUrl: PHOTO_URL });

    avatar.setProfile({ name: 'Mary Ann' });
    expect(photoOf(element)).toBeNull();
    expect(element.textContent).toBe('MA');
  });

  it('uses the requested color variant', () => {
    expect(mountAvatar(new UserAvatar({ variant: 'accent' })).classList.contains('user-avatar--accent')).toBe(true);
  });
});
