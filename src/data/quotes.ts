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

type CacheEntry = { data: Quote | { error: string }; at: number };

const CACHE_TTL_MS = 60_000; // 1 minute
const cache = new Map<string, CacheEntry>();

function isFresh(at: number) {
  return Date.now() - at < CACHE_TTL_MS;
}

export async function getQuote(symbol: string): Promise<Quote | { error: string; symbol: string }> {
  const cached = cache.get(symbol);
  if (cached && isFresh(cached.at)) {
    const d = cached.data as any;
    return { ...d, symbol };
  }
  try {
    const q = await yahooFinance.quote(symbol);
    const data: Quote = {
      symbol: q.symbol ?? symbol,
      shortName: q.shortName,
      regularMarketPrice: q.regularMarketPrice,
      regularMarketChange: q.regularMarketChange,
      regularMarketChangePercent: q.regularMarketChangePercent,
    };
    cache.set(symbol, { data, at: Date.now() });
    return data;
  } catch (e: any) {
    const err = { error: "Invalid or unavailable symbol", symbol };
    cache.set(symbol, { data: err, at: Date.now() });
    return err;
  }
}

export async function getQuotes(symbols: string[]): Promise<(Quote | { error: string; symbol: string })[]> {
  return Promise.all(symbols.map((s) => getQuote(s)));
}

export function clearQuotesCache() {
  cache.clear();
}
