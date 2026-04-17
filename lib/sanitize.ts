const ALLOWED_TAG = /<\/?(em|br)\s*\/?>/gi;
const ANY_TAG = /<[^>]*>/g;

export function sanitizeInlineHtml(input: string | undefined | null): string {
  if (!input) return '';
  const placeholders: string[] = [];
  const withMarkers = input.replace(ALLOWED_TAG, (match) => {
    placeholders.push(match.toLowerCase().replace(/\s+\/?>/, match.endsWith('/>') ? ' />' : '>'));
    return `\u0000${placeholders.length - 1}\u0000`;
  });
  const escaped = withMarkers
    .replace(ANY_TAG, '')
    .replace(/&(?!(amp|lt|gt|quot|#39|#x27);)/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/\u0000(\d+)\u0000/g, (_, i) => placeholders[Number(i)] ?? '');
}
