// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { escapeHtml } from './escape-html';

describe('escapeHtml', () => {
  it('escapes every character that can open markup or break an attribute', () => {
    expect(escapeHtml(`<img src=x onerror="alert('1')"> & co`)).toBe(
      '&lt;img src=x onerror=&quot;alert(&#39;1&#39;)&quot;&gt; &amp; co',
    );
  });

  it('leaves plain text untouched', () => {
    expect(escapeHtml('Tiny Glade 2')).toBe('Tiny Glade 2');
  });

  it('makes injected markup inert when it is put into innerHTML', () => {
    const container = document.createElement('div');
    container.innerHTML = escapeHtml('<b>bold</b>');
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toBe('<b>bold</b>');
  });
});
