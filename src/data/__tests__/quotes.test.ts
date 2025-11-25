import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { getQuotes, getQuote, clearQuotesCache } from "../quotes";

// Mock yahoo-finance2
const { mockQuote } = vi.hoisted(() => {
  return { mockQuote: vi.fn() };
});

vi.mock("yahoo-finance2", () => {
  return {
    default: class {
      quote = mockQuote;
    },
  };
});

describe("getQuotes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    clearQuotesCache();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("fetches quotes successfully", async () => {
    mockQuote.mockResolvedValue({
      symbol: "AAPL",
      shortName: "Apple Inc.",
      regularMarketPrice: 150,
      regularMarketChange: 1.5,
      regularMarketChangePercent: 1.0,
    });

    const results = await getQuotes(["AAPL"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      ok: true,
      data: {
        symbol: "AAPL",
        shortName: "Apple Inc.",
        regularMarketPrice: 150,
        regularMarketChange: 1.5,
        regularMarketChangePercent: 1.0,
      },
    });
    expect(mockQuote).toHaveBeenCalledWith("AAPL");
  });

  it("handles errors and returns error object", async () => {
    mockQuote.mockRejectedValue(new Error("Not found"));

    const results = await getQuotes(["INVALID"]);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      ok: false,
      symbol: "INVALID",
      error: "Invalid or unavailable symbol",
    });
  });

  it("caches results within TTL", async () => {
    mockQuote.mockResolvedValue({
      symbol: "AAPL",
      regularMarketPrice: 100,
    });

    // First call
    await getQuotes(["AAPL"]);
    expect(mockQuote).toHaveBeenCalledTimes(1);

    // Second call - should use cache
    await getQuotes(["AAPL"]);
    expect(mockQuote).toHaveBeenCalledTimes(1);
  });

  it("refreshes cache after TTL expires", async () => {
    vi.useFakeTimers();

    mockQuote
      .mockResolvedValueOnce({
        symbol: "AAPL",
        regularMarketPrice: 100,
      })
      .mockResolvedValueOnce({
        symbol: "AAPL",
        regularMarketPrice: 105,
      });

    // First call
    const result1 = await getQuote("AAPL");
    expect(mockQuote).toHaveBeenCalledTimes(1);
    expect(result1).toEqual({
      ok: true,
      data: { symbol: "AAPL", regularMarketPrice: 100 },
    });

    // Advance time by 30 seconds (within TTL)
    vi.advanceTimersByTime(30_000);
    const result2 = await getQuote("AAPL");
    expect(mockQuote).toHaveBeenCalledTimes(1); // Still cached
    expect(result2).toEqual({
      ok: true,
      data: { symbol: "AAPL", regularMarketPrice: 100 },
    });

    // Advance time by another 31 seconds (past 60s TTL)
    vi.advanceTimersByTime(31_000);
    const result3 = await getQuote("AAPL");
    expect(mockQuote).toHaveBeenCalledTimes(2); // Cache expired, fetched again
    expect(result3).toEqual({
      ok: true,
      data: { symbol: "AAPL", regularMarketPrice: 105 },
    });
  });

  it("caches errors with same TTL", async () => {
    vi.useFakeTimers();

    mockQuote.mockRejectedValueOnce(new Error("Not found")).mockResolvedValueOnce({
      symbol: "RETRY",
      regularMarketPrice: 50,
    });

    // First call - error
    const result1 = await getQuote("RETRY");
    expect(result1).toEqual({ ok: false, symbol: "RETRY", error: "Invalid or unavailable symbol" });
    expect(mockQuote).toHaveBeenCalledTimes(1);

    // Second call within TTL - still cached error
    const result2 = await getQuote("RETRY");
    expect(result2).toEqual({ ok: false, symbol: "RETRY", error: "Invalid or unavailable symbol" });
    expect(mockQuote).toHaveBeenCalledTimes(1);

    // Advance past TTL
    vi.advanceTimersByTime(61_000);
    const result3 = await getQuote("RETRY");
    expect(result3).toEqual({ ok: true, data: { symbol: "RETRY", regularMarketPrice: 50 } });
    expect(mockQuote).toHaveBeenCalledTimes(2);
  });

  it("fetches multiple symbols in parallel", async () => {
    mockQuote.mockImplementation((symbol: string) => {
      return Promise.resolve({
        symbol,
        regularMarketPrice: symbol === "AAPL" ? 150 : 300,
      });
    });

    const results = await getQuotes(["AAPL", "MSFT"]);

    expect(results).toHaveLength(2);
    expect(results[0]).toEqual({ ok: true, data: { symbol: "AAPL", regularMarketPrice: 150 } });
    expect(results[1]).toEqual({ ok: true, data: { symbol: "MSFT", regularMarketPrice: 300 } });
    expect(mockQuote).toHaveBeenCalledTimes(2);
  });

  it("handles mixed success and failure results", async () => {
    mockQuote.mockImplementation((symbol: string) => {
      if (symbol === "INVALID") {
        return Promise.reject(new Error("Not found"));
      }
      return Promise.resolve({
        symbol,
        regularMarketPrice: 150,
      });
    });

    const results = await getQuotes(["AAPL", "INVALID", "MSFT"]);

    expect(results).toHaveLength(3);
    expect(results[0]).toEqual({ ok: true, data: { symbol: "AAPL", regularMarketPrice: 150 } });
    expect(results[1]).toEqual({ ok: false, symbol: "INVALID", error: "Invalid or unavailable symbol" });
    expect(results[2]).toEqual({ ok: true, data: { symbol: "MSFT", regularMarketPrice: 150 } });
  });

  it("uses symbol from response if available, fallback to input", async () => {
    mockQuote.mockResolvedValue({
      symbol: "AAPL.US", // API returns different format
      regularMarketPrice: 150,
    });

    const results = await getQuotes(["AAPL"]);
    expect(results[0]).toEqual({
      ok: true,
      data: { symbol: "AAPL.US", regularMarketPrice: 150 },
    });
  });

  it("handles empty symbols array", async () => {
    const results = await getQuotes([]);
    expect(results).toEqual([]);
    expect(mockQuote).not.toHaveBeenCalled();
  });
});
