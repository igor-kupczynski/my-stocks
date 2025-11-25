import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance({
  suppressNotices: ["yahooSurvey"],
});

export type Quote = {
  symbol: string;
  shortName?: string;
  regularMarketPrice?: number;
  regularMarketChange?: number;
  regularMarketChangePercent?: number;
};

/** Discriminated union for quote fetch results */
export type QuoteResult = { ok: true; data: Quote } | { ok: false; symbol: string; error: string };

type CacheEntry = { result: QuoteResult; at: number };

const CACHE_TTL_MS = 60_000; // 1 minute
const cache = new Map<string, CacheEntry>();

function isFresh(at: number) {
  return Date.now() - at < CACHE_TTL_MS;
}

export async function getQuote(symbol: string): Promise<QuoteResult> {
  const cached = cache.get(symbol);
  if (cached && isFresh(cached.at)) {
    return cached.result;
  }
  try {
    const q = await yahooFinance.quote(symbol);
    const result: QuoteResult = {
      ok: true,
      data: {
        symbol: q.symbol ?? symbol,
        shortName: q.shortName,
        regularMarketPrice: q.regularMarketPrice,
        regularMarketChange: q.regularMarketChange,
        regularMarketChangePercent: q.regularMarketChangePercent,
      },
    };
    cache.set(symbol, { result, at: Date.now() });
    return result;
  } catch {
    const result: QuoteResult = { ok: false, symbol, error: "Invalid or unavailable symbol" };
    cache.set(symbol, { result, at: Date.now() });
    return result;
  }
}

export async function getQuotes(symbols: string[]): Promise<QuoteResult[]> {
  const settled = await Promise.allSettled(symbols.map((s) => getQuote(s)));
  return settled.map((result, i) => {
    if (result.status === "fulfilled") {
      return result.value;
    }
    // Should not happen since getQuote catches errors, but handle defensively
    return { ok: false as const, symbol: symbols[i], error: "Unexpected error" };
  });
}

export function clearQuotesCache() {
  cache.clear();
}
