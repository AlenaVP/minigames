const HTML_ENTITIES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

/**
 * Any data that is not ours (mocks today, API responses in Story 3) goes into innerHTML only through this.
 * Otherwise a game named `<img src=x onerror=alert(1)>` becomes executable code.
 */
export function escapeHtml(value: string): string {
  return value.replaceAll(/[&<>"']/g, (char) => HTML_ENTITIES[char] ?? char);
}
