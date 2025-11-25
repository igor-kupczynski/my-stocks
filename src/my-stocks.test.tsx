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

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("No stocks configured");
      expect(screen.getByRole("status")).toHaveTextContent("Set a comma-separated list");
    });

    expect(QuotesData.getQuotes).not.toHaveBeenCalled();
  });

  it("shows loading state initially", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL" });

    // Make getQuotes hang to test loading state
    vi.mocked(QuotesData.getQuotes).mockImplementation(() => new Promise(() => {}));

    render(<Command />);

    // Check loading state is true initially
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("data-loading", "true");
  });

  it("fetches and displays stocks with correct formatting", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "AAPL",
          regularMarketPrice: 150.5,
          regularMarketChange: 1.5,
          regularMarketChangePercent: 1.01,
          shortName: "Apple Inc.",
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      // Verify symbol and company name
      expect(item).toHaveTextContent("AAPL");
      expect(item).toHaveTextContent("Apple Inc.");
      // Verify price formatting with $ and 2 decimal places
      expect(item).toHaveTextContent("$150.50");
      // Verify positive percent change
      expect(item).toHaveTextContent("+1.01%");
      // Verify green color for positive change
      expect(item).toHaveTextContent("[green]");
    });
  });

  it("displays negative changes with red color and down arrow", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "MSFT" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "MSFT",
          regularMarketPrice: 300.0,
          regularMarketChange: -5.25,
          regularMarketChangePercent: -1.72,
          shortName: "Microsoft Corp.",
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      // Verify price
      expect(item).toHaveTextContent("$300.00");
      // Verify negative percent change
      expect(item).toHaveTextContent("-1.72%");
      // Verify red color for negative change
      expect(item).toHaveTextContent("[red]");
    });
  });

  it("handles zero change as neutral", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "FLAT" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "FLAT",
          regularMarketPrice: 100.0,
          regularMarketChange: 0,
          regularMarketChangePercent: 0,
          shortName: "Flat Stock",
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("+0.00");
      expect(item).toHaveTextContent("$100.00");
    });
  });

  it("handles missing price data gracefully", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "NODATA" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "NODATA",
          // Missing price fields
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("NODATA");
      // Should show em dash for missing price
      expect(item).toHaveTextContent("—");
    });
  });

  it("generates correct Yahoo Finance URLs with special characters encoded", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "^GSPC" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "^GSPC",
          regularMarketPrice: 5000.0,
          regularMarketChange: 10.0,
          regularMarketChangePercent: 0.2,
          shortName: "S&P 500",
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const link = screen.getByTestId("open-in-browser");
      // Caret should be URL encoded as %5E
      expect(link).toHaveAttribute("href", "https://finance.yahoo.com/quote/%5EGSPC");
    });
  });

  it("handles errors for individual stocks with error icon", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "INVALID" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      { ok: false as const, symbol: "INVALID", error: "Invalid or unavailable symbol" },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("INVALID");
      expect(item).toHaveTextContent("Invalid or unavailable symbol");
      // Verify error icon is set (now as a JSON object)
      expect(item.getAttribute("data-icon")).toContain("icon-error");
    });
  });

  it("displays multiple stocks in order", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL, MSFT, GOOGL" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: { symbol: "AAPL", regularMarketPrice: 150, regularMarketChange: 1, regularMarketChangePercent: 0.5 },
      },
      {
        ok: true as const,
        data: { symbol: "MSFT", regularMarketPrice: 300, regularMarketChange: -2, regularMarketChangePercent: -0.6 },
      },
      {
        ok: true as const,
        data: { symbol: "GOOGL", regularMarketPrice: 140, regularMarketChange: 0.5, regularMarketChangePercent: 0.3 },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const items = screen.getAllByRole("listitem");
      expect(items).toHaveLength(3);
      expect(items[0]).toHaveTextContent("AAPL");
      expect(items[1]).toHaveTextContent("MSFT");
      expect(items[2]).toHaveTextContent("GOOGL");
    });
  });

  it("provides copy to clipboard actions", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: { symbol: "AAPL", regularMarketPrice: 150, regularMarketChange: 1, regularMarketChangePercent: 0.5 },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const copyButtons = screen.getAllByTestId("copy-to-clipboard");
      // Should have both Copy Symbol and Copy Price actions
      expect(copyButtons).toHaveLength(2);
      expect(copyButtons[0]).toHaveAttribute("data-content", "AAPL");
      expect(copyButtons[1]).toHaveAttribute("data-content", "150.00");
    });
  });

  it("shows detail panel with stock metadata", async () => {
    vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL" });

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "AAPL",
          shortName: "Apple Inc.",
          longName: "Apple Inc.",
          regularMarketPrice: 150.5,
          regularMarketChange: 1.5,
          regularMarketChangePercent: 1.01,
          regularMarketOpen: 149.0,
          regularMarketDayHigh: 151.0,
          regularMarketDayLow: 148.5,
          marketCap: 2500000000000,
          exchange: "NASDAQ",
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      // Check for detail panel elements
      expect(screen.getByTestId("list-item-detail")).toBeInTheDocument();
      expect(screen.getByTestId("detail-metadata")).toBeInTheDocument();
      // Check for metadata content (day trading info)
      const metadata = screen.getByTestId("detail-metadata");
      expect(metadata).toHaveTextContent("Open");
      expect(metadata).toHaveTextContent("$149.00");
      expect(metadata).toHaveTextContent("High");
      expect(metadata).toHaveTextContent("$151.00");
    });
  });
});
