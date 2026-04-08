export function generateSlug(companyName: string, roleLabel?: string): string {
  const parts = roleLabel
    ? `${companyName} ${roleLabel}`
    : companyName;

  return parts
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
