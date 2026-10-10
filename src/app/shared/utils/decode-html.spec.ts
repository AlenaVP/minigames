// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import { decodeHtmlEntities } from './decode-html';
import { escapeHtml } from './escape-html';

describe('decodeHtmlEntities', () => {
  it('decodes the entities the API stores in comment text', () => {
    expect(decodeHtmlEntities('Tom &amp; Jerry &lt;3 &quot;hi&quot;')).toBe('Tom & Jerry <3 "hi"');
  });

  it('returns text without entities as is', () => {
    expect(decodeHtmlEntities('Plain text')).toBe('Plain text');
  });

  it('round-trips with escapeHtml: decode once, escape once → the user sees the original text', () => {
    const stored = 'Tom &amp; Jerry';
    const container = document.createElement('p');
    container.innerHTML = escapeHtml(decodeHtmlEntities(stored));
    expect(container.textContent).toBe('Tom & Jerry');
  });
});
