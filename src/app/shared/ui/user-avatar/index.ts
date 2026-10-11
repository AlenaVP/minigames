import { ComponentBase } from '@app/core/component.base';
import { getProfileInitials } from '@shared/utils/avatar';
import './user-avatar.scss';

/** What the avatar is drawn from — the app session's displayName / avatarUrl */
export interface AvatarProfile {
  name: string;
  photoUrl?: string;
}

export interface UserAvatarOptions {
  /** 'default' — dark circle on a light background (header, Guidebook); 'accent' — yellow circle for the dark burger menu */
  variant?: 'default' | 'accent';
}

/**
 * The signed-in user's avatar (RSS-QS-4-3-1): photo → initials → generic person icon.
 *
 * The photo is laid OVER the initials: while it loads, and if it fails, the user sees the initials, never an empty circle
 * or a broken-image icon. Decorative (aria-hidden): the name is always written as text next to it.
 */
export class UserAvatar extends ComponentBase {
  private readonly variant: NonNullable<UserAvatarOptions['variant']>;
  private profile: AvatarProfile | null = null;
  /** A photo that failed once is not requested again on every repaint (another tab, a session sync) */
  private readonly brokenPhotos = new Set<string>();

  constructor({ variant = 'default' }: UserAvatarOptions = {}) {
    super();
    this.variant = variant;
  }

  /** null = nobody to draw (guest): the generic icon */
  setProfile(profile: AvatarProfile | null): void {
    this.profile = profile;
    if (this.element) this.paint(this.element);
  }

  protected render(): HTMLElement {
    const avatar = document.createElement('span');
    avatar.className = `user-avatar user-avatar--${this.variant}`;
    avatar.setAttribute('aria-hidden', 'true');
    this.paint(avatar);
    return avatar;
  }

  private paint(avatar: HTMLElement): void {
    const initials = getProfileInitials(this.profile?.name ?? '');
    avatar.classList.toggle('user-avatar--placeholder', initials === '');
    // textContent, never innerHTML: the name comes from the identity provider and the editable localStorage record
    avatar.textContent = initials;

    const photoUrl = this.profile?.photoUrl;
    if (photoUrl && !this.brokenPhotos.has(photoUrl)) avatar.append(this.createPhoto(photoUrl));
  }

  private createPhoto(url: string): HTMLImageElement {
    const photo = document.createElement('img');
    photo.className = 'user-avatar__photo';
    photo.alt = '';
    photo.decoding = 'async';
    // Google profile photos are known to answer 403 to some Referer headers; the page URL is none of their business anyway
    photo.referrerPolicy = 'no-referrer';
    photo.addEventListener(
      'error',
      () => {
        this.brokenPhotos.add(url);
        photo.remove();
      },
      { once: true },
    );
    photo.src = url;
    return photo;
  }
}
