// @vitest-environment happy-dom
import { afterEach, describe, expect, it, vi } from 'vitest';
import { query, textOf } from '@testing/dom';
import { EmptyState } from '.';

describe('EmptyState', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('shows only the title when there is nothing else', () => {
    new EmptyState({ title: 'Data Not Found' }).mount(document.body);

    expect(textOf(query('.empty-state__title'))).toBe('Data Not Found');
    expect(document.querySelector('.empty-state__message')).toBeNull();
    expect(document.querySelector('.empty-state__action')).toBeNull();
  });

  it('shows the message and an action button that calls back', () => {
    const onClick = vi.fn();
    new EmptyState({
      title: 'Game Not Found',
      message: 'It may have been removed.',
      action: { label: 'Close', onClick },
    }).mount(document.body);

    expect(textOf(query('.empty-state__message'))).toBe('It may have been removed.');
    query('.empty-state__action').click();
    expect(onClick).toHaveBeenCalledOnce();
  });
});
