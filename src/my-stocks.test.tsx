/**
 * @vitest-environment happy-dom
 */
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import Command from "./my-stocks";
import * as QuotesData from "./data/quotes";
import * as ListsData from "./data/lists";
import type { StockList } from "./types";
import type { QuoteResult } from "./data/quotes";

// Mock quotes data
vi.mock("./data/quotes", () => ({
  getQuotes: vi.fn(),
}));

// Mock lists data
vi.mock("./data/lists", () => ({
  loadLists: vi.fn(),
  saveLists: vi.fn(),
}));

// Mock refresher to avoid timers
vi.mock("./utils/refresher", () => ({
  startRefresher: (cb: () => void) => {
    cb();
    return vi.fn();
  },
}));

// Test fixtures - centralized mock data
const fixtures = {
  createList: (overrides: Partial<StockList> = {}): StockList => ({
    id: "test-list-1",
    name: "Tech",
    icon: "📱",
    symbols: [],
    isPortfolio: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  }),

  createQuote: (symbol: string, overrides: Partial<QuoteResult["data"]> = {}): QuoteResult => ({
    ok: true as const,
    data: {
      symbol,
      regularMarketPrice: 150.0,
      regularMarketChange: 1.0,
      regularMarketChangePercent: 0.5,
      shortName: `${symbol} Inc.`,
      ...overrides,
    },
  }),

  createErrorQuote: (symbol: string, error = "Invalid or unavailable symbol"): QuoteResult => ({
    ok: false as const,
    symbol,
    error,
  }),
};

describe("Command Component", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  it("renders empty state when no symbols configured", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([]);

    render(<Command />);

    await waitFor(() => {
      expect(screen.getByRole("status")).toHaveTextContent("No stocks in your lists");
      expect(screen.getByRole("status")).toHaveTextContent("Use the Manage Lists command");
    });

    expect(QuotesData.getQuotes).not.toHaveBeenCalled();
  });

  it("shows loading state initially", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "AAPL" }],
      }),
    ]);

    // Make getQuotes hang to test loading state
    vi.mocked(QuotesData.getQuotes).mockImplementation(() => new Promise(() => {}));

    render(<Command />);

    // Check loading state is true initially
    const list = screen.getByRole("list");
    expect(list).toHaveAttribute("data-loading", "true");
  });

  it("fetches and displays stocks with correct formatting", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "AAPL" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      fixtures.createQuote("AAPL", {
        regularMarketPrice: 150.5,
        regularMarketChange: 1.5,
        regularMarketChangePercent: 1.01,
        shortName: "Apple Inc.",
      }),
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("AAPL");
      expect(item).toHaveTextContent("Apple Inc.");
      expect(item).toHaveTextContent("$150.50");
      expect(item).toHaveTextContent("+1.01%");
      expect(item).toHaveTextContent("[green]");
    });
  });

  it("displays negative changes with red color and down arrow", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "MSFT" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      fixtures.createQuote("MSFT", {
        regularMarketPrice: 300.0,
        regularMarketChange: -5.25,
        regularMarketChangePercent: -1.72,
        shortName: "Microsoft Corp.",
      }),
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("$300.00");
      expect(item).toHaveTextContent("-1.72%");
      expect(item).toHaveTextContent("[red]");
    });
  });

  it("handles zero change as neutral", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "FLAT" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      fixtures.createQuote("FLAT", {
        regularMarketPrice: 100.0,
        regularMarketChange: 0,
        regularMarketChangePercent: 0,
        shortName: "Flat Stock",
      }),
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("+0.00");
      expect(item).toHaveTextContent("$100.00");
    });
  });

  it("handles missing price data gracefully", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "NODATA" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      {
        ok: true as const,
        data: {
          symbol: "NODATA",
          // Missing price fields intentionally
        },
      },
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("NODATA");
      expect(item).toHaveTextContent("—");
    });
  });

  it("generates correct Yahoo Finance URLs with special characters encoded", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        name: "Indices",
        icon: "📊",
        symbols: [{ symbol: "^GSPC" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      fixtures.createQuote("^GSPC", {
        regularMarketPrice: 5000.0,
        regularMarketChange: 10.0,
        regularMarketChangePercent: 0.2,
        shortName: "S&P 500",
      }),
    ]);

    render(<Command />);

    await waitFor(() => {
      const link = screen.getByTestId("open-in-browser");
      expect(link).toHaveAttribute("href", "https://finance.yahoo.com/quote/%5EGSPC");
    });
  });

  it("handles errors for individual stocks with error icon", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "INVALID" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([fixtures.createErrorQuote("INVALID")]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("INVALID");
      expect(item).toHaveTextContent("Failed to load quote");
      expect(item).toHaveAttribute("data-icon", expect.stringContaining("icon-error"));
    });
  });

  it("displays multiple stocks in order", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "AAPL" }, { symbol: "MSFT" }, { symbol: "GOOGL" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      fixtures.createQuote("AAPL", { regularMarketPrice: 150 }),
      fixtures.createQuote("MSFT", {
        regularMarketPrice: 300,
        regularMarketChange: -2,
        regularMarketChangePercent: -0.6,
      }),
      fixtures.createQuote("GOOGL", { regularMarketPrice: 140 }),
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
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "AAPL" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([fixtures.createQuote("AAPL", { regularMarketPrice: 150 })]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("AAPL");
      // Actions are rendered inside ActionPanel
      const copyButtons = screen.getAllByTestId("copy-to-clipboard");
      expect(copyButtons.length).toBeGreaterThanOrEqual(1);
    });
  });

  it("renders stock items with all data", async () => {
    vi.mocked(ListsData.loadLists).mockResolvedValue([
      fixtures.createList({
        symbols: [{ symbol: "AAPL" }],
      }),
    ]);

    vi.mocked(QuotesData.getQuotes).mockResolvedValue([
      fixtures.createQuote("AAPL", {
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
      }),
    ]);

    render(<Command />);

    await waitFor(() => {
      const item = screen.getByRole("listitem");
      expect(item).toHaveTextContent("AAPL");
      expect(item).toHaveTextContent("Apple Inc.");
      expect(item).toHaveTextContent("$150.50");
      expect(item).toHaveTextContent("+1.01%");
    });
  });
});
