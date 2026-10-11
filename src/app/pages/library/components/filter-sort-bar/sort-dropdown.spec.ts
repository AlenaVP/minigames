// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { SortValue } from '@shared/types/game';
import { installPopoverStub, query, queryAll, textOf } from '@testing/dom';
import { SORT_OPTIONS } from '../../library.constants';
import { SortDropdown } from './sort-dropdown';

const option = (value: SortValue): HTMLLIElement => query(`[data-value="${value}"]`);
const selected = (): string[] => queryAll('[aria-selected="true"]').map((element) => element.dataset.value ?? '');

function key(name: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key: name, bubbles: true, cancelable: true });
  query('.sort-dropdown__list').dispatchEvent(event);
  return event;
}

function openList(): void {
  const event = new Event('toggle');
  Object.defineProperty(event, 'newState', { value: 'open' });
  query('.sort-dropdown__list').dispatchEvent(event);
}

describe('SortDropdown', () => {
  let dropdown: SortDropdown;
  let onChange: ReturnType<typeof vi.fn<(value: SortValue) => void>>;

  beforeEach(() => {
    installPopoverStub();
    onChange = vi.fn<(value: SortValue) => void>();
    dropdown = new SortDropdown({ id: 'test-sort', options: SORT_OPTIONS, selected: 'rating-desc', onChange });
    dropdown.mount(document.body);
  });

  afterEach(() => {
    dropdown.destroy();
  });

  it('shows the selected option in the trigger, with a full label for screen readers', () => {
    expect(textOf(query('.sort-dropdown__value'))).toBe('Rating ↓Rating, high to low');
    expect(selected()).toEqual(['rating-desc']);
    expect(query('.sort-dropdown__trigger').getAttribute('popovertarget')).toBe('test-sort-list');
  });

  it('focuses the selected option when the list opens', () => {
    openList();

    expect(document.activeElement).toBe(option('rating-desc'));
  });

  it('selects with a click: reports it, closes the list and returns the focus to the trigger', () => {
    option('name-asc').click();

    expect(onChange).toHaveBeenCalledWith('name-asc');
    expect(selected()).toEqual(['name-asc']);
    expect(document.activeElement).toBe(query('.sort-dropdown__trigger'));
  });

  it('does not report choosing the option that is already selected', () => {
    option('rating-desc').click();

    expect(onChange).not.toHaveBeenCalled();
  });

  it('moves with the arrows (wrapping), Home and End, and selects with Enter or Space', () => {
    openList();

    key('ArrowDown');
    expect(document.activeElement).toBe(option('name-asc'));
    key('ArrowUp');
    key('ArrowUp');
    expect(document.activeElement).toBe(option('rating-asc'));
    key('ArrowUp');
    expect(document.activeElement).toBe(option('name-desc'));
    key('Home');
    expect(document.activeElement).toBe(option('rating-asc'));
    key('End');
    key('Enter');
    expect(onChange).toHaveBeenLastCalledWith('name-desc');

    openList();
    key('Home');
    key(' ');
    expect(onChange).toHaveBeenLastCalledWith('rating-asc');
  });

  it('keeps the page from scrolling on the keys it handles, but not on Tab or other keys', () => {
    openList();

    expect(key('ArrowDown').defaultPrevented).toBe(true);
    expect(key('Tab').defaultPrevented).toBe(false);
    expect(key('a').defaultPrevented).toBe(false);
  });

  it('follows an outside change without reporting it back', () => {
    dropdown.setValue('name-desc');

    expect(selected()).toEqual(['name-desc']);
    expect(textOf(query('.sort-dropdown__value'))).toBe('Name Z→AName, Z to A');
    expect(onChange).not.toHaveBeenCalled();
  });
});
