/** The only localStorage key of the app session (documented in README for reviewers) */
export const SESSION_STORAGE_KEY = 'minigames:alenavp-minigames:app-session';

/** Fixed lifetime from the moment of authentication — reloads and activity do not extend it */
export const SESSION_TTL_MS = 5 * 60 * 1000;

/**
 * A stored authenticatedAt further in the future than this is treated as tampered data
 * (otherwise a hand-edited timestamp would make the session never expire). A minute absorbs clock corrections.
 */
export const SESSION_CLOCK_SKEW_MS = 60 * 1000;
