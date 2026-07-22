/** Builds a `?a=1&b=2` query string from a flat params object, skipping
 * undefined/empty values. Shared by every feature's list() call so pagination
 * (and any other filter) is appended consistently instead of each api.ts
 * hand-rolling its own `status ? \`?status=${status}\` : ''` string. */
export function buildQueryString(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== '') searchParams.set(key, String(value));
  }
  const query = searchParams.toString();
  return query ? `?${query}` : '';
}
