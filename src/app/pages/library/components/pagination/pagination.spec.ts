// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { query, queryAll, stubMatchMedia, type MediaQueryStub } from '@testing/dom';
import { Pagination } from '.';

const pages = (): string[] => queryAll('.pagination__page').map((button) => button.textContent ?? '');
const current = (): string | null => query('[aria-current="page"]').textContent;
const arrow = (direction: 'previous' | 'next'): HTMLButtonElement => query(`[data-page="${direction}"]`);

describe('Pagination', () => {
  let pagination: Pagination;
  let onPageChange: ReturnType<typeof vi.fn<(page: number) => void>>;
  let tablet: MediaQueryStub;

  function mount(isTablet = false): void {
    tablet = stubMatchMedia(isTablet);
    pagination = new Pagination({ onPageChange });
    pagination.mount(document.body);
  }

  beforeEach(() => {
    onPageChange = vi.fn<(page: number) => void>();
  });

  afterEach(() => {
    pagination.destroy();
  });

  it('stays hidden until the first response', () => {
    mount();
    expect(query('.pagination').hidden).toBe(true);

    pagination.setVisible(true);
    expect(query('.pagination').hidden).toBe(false);
  });

  it('shows a window of 3 pages on mobile and 4 from tablet up, around the current page', () => {
    mount(false);
    pagination.setState({ currentPage: 5, totalPages: 10 });
    expect(pages()).toEqual(['4', '5', '6']);

    tablet.setMatches(true);
    expect(pages()).toEqual(['4', '5', '6', '7']);
  });

  it('shows an empty result as page 1 with both arrows disabled', () => {
    mount();
    pagination.setState({ currentPage: 1, totalPages: 0 });

    expect(pages()).toEqual(['1']);
    expect(arrow('previous').disabled).toBe(true);
    expect(arrow('next').disabled).toBe(true);
  });

  it('goes to a clicked page and by the arrows, reporting each change', () => {
    mount(true);
    pagination.setState({ currentPage: 1, totalPages: 5 });

    query('[data-page="3"]').click();
    arrow('next').click();
    arrow('previous').click();

    expect(onPageChange.mock.calls).toEqual([[3], [4], [3]]);
    expect(current()).toBe('3');
  });

  it('ignores a click on the current page and on a disabled arrow', () => {
    mount();
    pagination.setState({ currentPage: 1, totalPages: 3 });

    query('[data-page="1"]').click();
    arrow('previous').click();

    expect(onPageChange).not.toHaveBeenCalled();
  });

  it('keeps the focus on the current page after the list is rebuilt', () => {
    mount();
    pagination.setState({ currentPage: 1, totalPages: 9 });

    const target = query<HTMLButtonElement>('[data-page="2"]');
    target.focus();
    target.click();

    expect(document.activeElement?.getAttribute('aria-current')).toBe('page');
    expect(document.activeElement?.textContent).toBe('2');
  });

  it('moves the focus off an arrow that becomes disabled', () => {
    mount();
    pagination.setState({ currentPage: 2, totalPages: 3 });

    arrow('next').focus();
    arrow('next').click();

    expect(document.activeElement?.textContent).toBe('3');
  });
});
