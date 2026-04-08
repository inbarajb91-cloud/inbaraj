import { createHash } from 'crypto';

export function generateSlug(companyName: string, date?: string): string {
  const dateStr = date ?? new Date().toISOString().slice(0, 10);
  const input = `${companyName.toLowerCase().trim()}${dateStr}`;
  const hash = createHash('sha256').update(input).digest('hex');
  return hash.slice(0, 8);
}
