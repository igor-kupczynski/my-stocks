
import { describe, it, expect, vi, beforeEach } from "vitest";
import { getQuotes, clearQuotesCache } from "../quotes";

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
      symbol: "AAPL",
      shortName: "Apple Inc.",
      regularMarketPrice: 150,
      regularMarketChange: 1.5,
      regularMarketChangePercent: 1.0,
    });
    expect(mockQuote).toHaveBeenCalledWith("AAPL");
  });

  it("handles errors and returns error object", async () => {
    mockQuote.mockRejectedValue(new Error("Not found"));

    const results = await getQuotes(["INVALID"]);
    expect(results).toHaveLength(1);
    expect((results[0] as any).error).toBe("Invalid or unavailable symbol");
    expect((results[0] as any).symbol).toBe("INVALID");
  });

  it("caches results", async () => {
    mockQuote.mockResolvedValue({
      symbol: "AAPL",
      regularMarketPrice: 100,
    });

    // First call
    await getQuotes(["AAPL"]);
    expect(mockQuote).toHaveBeenCalledTimes(1);

    // Second call
    await getQuotes(["AAPL"]);
    expect(mockQuote).toHaveBeenCalledTimes(1); // Should still be 1
  });
});
