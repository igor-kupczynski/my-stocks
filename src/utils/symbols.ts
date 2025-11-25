/**
 * Valid stock symbol pattern:
 * - Uppercase letters (A-Z)
 * - Numbers (0-9)
 * - Dots (.) for stocks like BRK.B
 * - Caret (^) for indices like ^GSPC
 * - Hyphen (-) for some international stocks
 * - Equals (=) for forex pairs like EURUSD=X
 */
const VALID_SYMBOL = /^[A-Z0-9.^=-]+$/;

/**
 * Parse a comma-separated list of symbols into an array of uppercase tickers.
 * - Trims whitespace
 * - Filters empty entries
 * - Validates symbol format
 * - Deduplicates while preserving order
 */
export function parseSymbols(input: string | undefined | null): string[] {
  if (!input) return [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of input.split(",")) {
    const s = raw.trim().toUpperCase();
    if (!s) continue;
    if (!VALID_SYMBOL.test(s)) continue;
    if (!seen.has(s)) {
      seen.add(s);
      result.push(s);
    }
  }
  return result;
}
