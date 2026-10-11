import { describe, expect, it } from 'vitest';
import { COMMENT_MAX_LENGTH, checkCommentText, resolveCommentAuthorName } from './comment-rules';

describe('checkCommentText', () => {
  it('sends the trimmed text', () => {
    expect(checkCommentText('  Such a calming little game!\n')).toEqual({ ok: true, text: 'Such a calming little game!' });
  });

  it('keeps line breaks inside the text', () => {
    expect(checkCommentText('Line one\nLine two')).toEqual({ ok: true, text: 'Line one\nLine two' });
  });

  it.each(['', ' '.repeat(3), '\n\t'])('rejects a blank text: %j', (raw) => {
    expect(checkCommentText(raw)).toEqual({ ok: false, reason: 'empty' });
  });

  it('accepts exactly 500 characters and rejects 501 (after trimming)', () => {
    expect(checkCommentText(`  ${'a'.repeat(COMMENT_MAX_LENGTH)}  `).ok).toBe(true);
    expect(checkCommentText('a'.repeat(COMMENT_MAX_LENGTH + 1))).toEqual({ ok: false, reason: 'too-long' });
  });
});

describe('resolveCommentAuthorName', () => {
  const email = 'forest.dweller@rs.school';

  it('uses the display name when it is 2–30 characters long', () => {
    expect(resolveCommentAuthorName({ displayName: ' John Doe ', email })).toBe('John Doe');
  });

  it('cuts a name longer than 30 characters instead of dropping it', () => {
    const name = resolveCommentAuthorName({ displayName: 'Maximilian Alexander von Habsburg-Lothringen', email });
    expect(name).toBe('Maximilian Alexander von Habsb');
    expect(name).toHaveLength(30);
  });

  it('never cuts an emoji in half', () => {
    const name = resolveCommentAuthorName({ displayName: `${'a'.repeat(29)}😀`, email });
    expect(name).toBe('a'.repeat(29));
  });

  it('falls back to the email local part for a one-letter name', () => {
    expect(resolveCommentAuthorName({ displayName: 'J', email })).toBe('forest.dweller');
  });

  it('falls back to "Player" when neither fits', () => {
    expect(resolveCommentAuthorName({ displayName: 'J', email: 'x@rs.school' })).toBe('Player');
  });
});
