/**
 * The API sanitises comment text on save: tags are stripped and entities escaped
 * ("Tom & Jerry" is stored as "Tom &amp; Jerry"). Rendering it through escapeHtml() again would show
 * "&amp;" on screen, so the text is decoded ONCE first and escaped again on output:
 *
 *   "Tom &amp; Jerry" → decode → "Tom & Jerry" → escapeHtml → innerHTML → "Tom & Jerry" ✅
 *
 * DOMParser builds an inert document: no scripts run, no images load.
 */
export function decodeHtmlEntities(text: string): string {
  if (!text.includes('&')) return text;
  return new DOMParser().parseFromString(text, 'text/html').documentElement.textContent;
}
