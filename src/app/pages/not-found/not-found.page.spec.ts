// @vitest-environment happy-dom
import { afterEach, describe, expect, it } from 'vitest';
import { query, textOf } from '@testing/dom';
import { NotFoundPage } from './not-found.page';

function mountAt(path: string): void {
  history.replaceState(null, '', `${import.meta.env.BASE_URL}${path}`);
  new NotFoundPage().mount(document.body);
}

describe('NotFoundPage', () => {
  afterEach(() => {
    document.body.replaceChildren();
  });

  it('names the missing path, decoded for reading and escaped', () => {
    mountAt('caf%C3%A9/%3Cb%3E');

    expect(textOf(query('.not-found__path'))).toBe('/café/<b>');
    expect(document.querySelector('.not-found__path b')).toBeNull();
  });

  it('shows a broken escape as it is instead of failing', () => {
    mountAt('%E0%A4%A');

    expect(textOf(query('.not-found__path'))).toBe('/%E0%A4%A');
  });

  it('has the page heading and a link (not a button) back home', () => {
    mountAt('nowhere');

    expect(textOf(query('h1'))).toBe('Page not found');
    expect(query('.not-found__action').tagName).toBe('A');
  });
});
