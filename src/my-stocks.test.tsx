/**
 * @vitest-environment happy-dom
 */
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Command from "./my-stocks";
import { getPreferenceValues } from "@raycast/api";
import * as QuotesData from "./data/quotes";

// Mock quotes data
vi.mock("./data/quotes", () => ({
  getQuotes: vi.fn(),
}));

// Mock refresher to avoid timers
vi.mock("./utils/refresher", () => ({
  startRefresher: (cb: () => void) => {
    cb();
    return vi.fn();
  },
}));

describe("Command Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no symbols configured", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "" });

    render(<Command />);

    // Should show empty view immediately or after quick load
    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("No stocks configured");
    });

    // Should not call getQuotes
    expect(QuotesData.getQuotes).not.toHaveBeenCalled();
  });

  it("fetches and displays stocks based on preferences", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL, MSFT" });

    const mockData = [
      {
        ok: true as const,
        data: {
          symbol: "AAPL",
          regularMarketPrice: 150.0,
          regularMarketChange: 1.5,
          regularMarketChangePercent: 1.0,
          shortName: "Apple Inc.",
        },
      },
      {
        ok: true as const,
        data: {
          symbol: "MSFT",
          regularMarketPrice: 300.0,
          regularMarketChange: -2.0,
          regularMarketChangePercent: -0.6,
          shortName: "Microsoft Corp.",
        },
      },
    ];

    vi.mocked(QuotesData.getQuotes).mockResolvedValue(mockData);

    render(<Command />);

    // Expect parsing to happen
    expect(QuotesData.getQuotes).toHaveBeenCalledWith(["AAPL", "MSFT"]);

    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(2);
      expect(items[0]).toHaveTextContent("AAPL");
      expect(items[0]).toHaveTextContent("Apple Inc.");
      expect(items[1]).toHaveTextContent("MSFT");
    });
  });

  it("handles errors for individual stocks", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "INVALID" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      { ok: false as const, symbol: "INVALID", error: "Invalid symbol" },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("INVALID");
      expect(item).toHaveTextContent("Invalid symbol");
    });
  });
});
