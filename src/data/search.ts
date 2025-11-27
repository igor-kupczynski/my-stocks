/**
 * Yahoo Finance search integration with caching
 */

import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

export interface SearchResult {
  symbol: string;
  name: string;
  price?: number;
  type: string; // Stock, ETF, Crypto, Index, etc.
  exchange?: string;
}

type CacheEntry = { results: SearchResult[]; at: number };

const CACHE_TTL_MS = 5 * 60_000; // 5 minutes
const cache = new Map<string, CacheEntry>();

function isFresh(at: number): boolean {
  return Date.now() - at < CACHE_TTL_MS;
}

/**
 * Search for stocks on Yahoo Finance
 * @param query Search query string
 * @returns Array of search results, cached for 5 minutes
 */
export async function searchStocks(query: string): Promise<SearchResult[]> {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];

  // Check cache
  const cached = cache.get(normalizedQuery);
  if (cached && isFresh(cached.at)) {
    return cached.results;
  }

  try {
    const searchResults = await yahooFinance.search(query);
    const results: SearchResult[] = (searchResults.quotes || [])
      .filter((quote) => quote.symbol && quote.shortname)
      .map((quote) => ({
        symbol: quote.symbol!,
        name: quote.shortname || quote.longname || quote.symbol!,
        price: quote.regularMarketPrice,
        type: formatQuoteType(quote.quoteType),
        exchange: quote.exchange,
      }))
      .slice(0, 20); // Limit to top 20 results

    // Cache the results
    cache.set(normalizedQuery, { results, at: Date.now() });
    return results;
  } catch (error) {
    console.error("Yahoo Finance search failed:", error);
    return [];
  }
}

/**
 * Format quote type for display
 */
function formatQuoteType(type: string | undefined): string {
  if (!type) return "Unknown";

  const typeMap: Record<string, string> = {
    EQUITY: "Stock",
    ETF: "ETF",
    MUTUALFUND: "Mutual Fund",
    INDEX: "Index",
    CRYPTOCURRENCY: "Crypto",
    FUTURE: "Future",
    CURRENCY: "Currency",
  };

  return typeMap[type.toUpperCase()] || type;
}

/**
 * Clear the search cache
 */
export function clearSearchCache(): void {
  cache.clear();
}
