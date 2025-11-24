/**
 * Parse a comma-separated list of symbols into an array of uppercase tickers.
 * - Trims whitespace
 * - Filters empty entries
 * - Deduplicates while preserving order
 */
export function parseSymbols(input: string | undefined | null): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(",")) {
    const s = raw.trim().toUpperCase();
    if (!s) continue;
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  return result;
}
