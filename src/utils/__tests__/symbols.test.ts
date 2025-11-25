import { describe, it, expect } from "vitest";
import { parseSymbols } from "../../utils/symbols";

describe("parseSymbols", () => {
  it("returns empty array for empty or undefined", () => {
    expect(parseSymbols("")).toEqual([]);
    expect(parseSymbols(undefined)).toEqual([]);
    expect(parseSymbols(null)).toEqual([]);
  });

  it("trims, uppercases, and filters empties", () => {
    expect(parseSymbols(" aapl , , msft ")).toEqual(["AAPL", "MSFT"]);
  });

  it("deduplicates while preserving order", () => {
    expect(parseSymbols("AAPL,msft,aapl,GOOGL,MSFT")).toEqual(["AAPL", "MSFT", "GOOGL"]);
  });

  it("accepts valid symbol formats", () => {
    // Standard stock symbols
    expect(parseSymbols("AAPL,MSFT,GOOGL")).toEqual(["AAPL", "MSFT", "GOOGL"]);
    // Stocks with dots (e.g., Berkshire Hathaway Class B)
    expect(parseSymbols("BRK.B,BRK.A")).toEqual(["BRK.B", "BRK.A"]);
    // Index symbols with caret
    expect(parseSymbols("^GSPC,^DJI")).toEqual(["^GSPC", "^DJI"]);
    // Forex pairs with equals
    expect(parseSymbols("EURUSD=X,GBPUSD=X")).toEqual(["EURUSD=X", "GBPUSD=X"]);
    // Symbols with numbers
    expect(parseSymbols("3M,A2A")).toEqual(["3M", "A2A"]);
    // Symbols with hyphens
    expect(parseSymbols("BF-B")).toEqual(["BF-B"]);
  });

  it("filters out invalid symbols", () => {
    // Symbols with spaces (after trimming, internal spaces invalid)
    expect(parseSymbols("AAPL, INVALID SYMBOL, MSFT")).toEqual(["AAPL", "MSFT"]);
    // Symbols with special characters
    expect(parseSymbols("AAPL,@INVALID,MSFT")).toEqual(["AAPL", "MSFT"]);
    expect(parseSymbols("AAPL,INVALID!,MSFT")).toEqual(["AAPL", "MSFT"]);
    expect(parseSymbols("AAPL,INVALID#,MSFT")).toEqual(["AAPL", "MSFT"]);
    // Symbols with underscores
    expect(parseSymbols("AAPL,INVALID_SYMBOL,MSFT")).toEqual(["AAPL", "MSFT"]);
  });
});
