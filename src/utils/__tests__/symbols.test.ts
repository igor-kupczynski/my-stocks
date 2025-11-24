import { describe, it, expect } from "vitest";
import { parseSymbols } from "../../utils/symbols";

describe("parseSymbols", () => {
  it("returns empty array for empty or undefined", () => {
    expect(parseSymbols("")).toEqual([]);
    expect(parseSymbols(undefined)).toEqual([]);
    expect(parseSymbols(null as any)).toEqual([]);
  });

  it("trims, uppercases, and filters empties", () => {
    expect(parseSymbols(" aapl , , msft ")).toEqual(["AAPL", "MSFT"]);
  });

  it("deduplicates while preserving order", () => {
    expect(parseSymbols("AAPL,msft,aapl,GOOGL,MSFT")).toEqual(["AAPL", "MSFT", "GOOGL"]);
  });
});
