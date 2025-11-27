/**
 * @vitest-environment happy-dom
 */
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, afterEach } from "vitest";
import { EditPositionForm } from "../EditPositionForm";
import type { Quote } from "../../data/quotes";
import type { ListItem } from "../../types";

describe("EditPositionForm", () => {
  afterEach(() => {
    cleanup();
  });

  const mockQuote: Quote = {
    symbol: "AAPL",
    shortName: "Apple Inc.",
    currency: "USD",
    regularMarketPrice: 189.84,
    regularMarketChange: 1.23,
    regularMarketChangePercent: 0.65,
    regularMarketPreviousClose: 188.61,
    regularMarketTime: new Date("2025-01-15T21:00:00Z"),
  };

  const mockListItem: ListItem = {
    symbol: "AAPL",
    units: 50,
    costBasis: 7500.0,
  };

  it("displays current quote information", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    expect(screen.getByText(/AAPL — Apple Inc./)).toBeInTheDocument();
    expect(screen.getByText(/Current Price: \$189.84/)).toBeInTheDocument();
  });

  it("pre-fills form with existing position data", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    const costBasisField = screen.getByRole("textbox", { name: /cost basis/i });

    expect(unitsField).toHaveValue("50");
    expect(costBasisField).toHaveValue("7500");
  });

  it("calculates current value correctly", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    // 50 shares × $189.84 = $9,492.00
    expect(screen.getByText(/Current Value/)).toBeInTheDocument();
    expect(screen.getByText(/\$9,492.00/)).toBeInTheDocument();
  });

  it("calculates unrealized P&L correctly", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    // Current value: $9,492, Cost: $7,500, P&L: +$1,992 (+26.56%)
    expect(screen.getByText(/Unrealized P&L/)).toBeInTheDocument();
    expect(screen.getByText(/\+\$1,992.00/)).toBeInTheDocument();
    expect(screen.getByText(/\+26.56%/)).toBeInTheDocument();
  });

  it("calculates cost per share correctly", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    // $7,500 / 50 shares = $150.00
    expect(screen.getByText(/Cost per Share/)).toBeInTheDocument();
    expect(screen.getByText(/\$150.00/)).toBeInTheDocument();
  });

  it("updates calculations when units change", () => {
    const onSave = vi.fn();
    const { rerender } = render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });

    // Change units to 100
    fireEvent.change(unitsField, { target: { value: "100" } });

    // Trigger re-render to see updated calculations
    rerender(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    // New current value: 100 × $189.84 = $18,984.00
    expect(screen.getByText(/\$18,984.00/)).toBeInTheDocument();
  });

  it("shows validation error for negative units", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    fireEvent.change(unitsField, { target: { value: "-10" } });

    expect(screen.getByText(/Must be a positive number/)).toBeInTheDocument();
  });

  it("shows validation error for invalid units", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    fireEvent.change(unitsField, { target: { value: "abc" } });

    expect(screen.getByText(/Must be a positive number/)).toBeInTheDocument();
  });

  it("handles empty position data", () => {
    const onSave = vi.fn();
    const emptyListItem: ListItem = { symbol: "AAPL" };
    render(<EditPositionForm listItem={emptyListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    const costBasisField = screen.getByRole("textbox", { name: /cost basis/i });

    expect(unitsField).toHaveValue("");
    expect(costBasisField).toHaveValue("");
  });

  it("does not show unrealized P&L when cost basis is empty", () => {
    const onSave = vi.fn();
    const listItemWithoutCost: ListItem = { symbol: "AAPL", units: 50 };
    render(<EditPositionForm listItem={listItemWithoutCost} quote={mockQuote} onSave={onSave} />);

    expect(screen.queryByText(/Unrealized P&L/)).not.toBeInTheDocument();
    expect(screen.getByText(/Current Value/)).toBeInTheDocument();
  });

  it("clears position data when units is set to 0", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    fireEvent.change(unitsField, { target: { value: "0" } });

    const submitButton = screen.getByRole("button", { name: /save position/i });
    fireEvent.click(submitButton);

    // Should save with undefined for both values
    expect(onSave).toHaveBeenCalledWith(undefined, undefined);
  });

  it("clears position data when units is empty", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    fireEvent.change(unitsField, { target: { value: "" } });

    const submitButton = screen.getByRole("button", { name: /save position/i });
    fireEvent.click(submitButton);

    // Should save with undefined for both values
    expect(onSave).toHaveBeenCalledWith(undefined, undefined);
  });

  it("saves valid position data", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    const costBasisField = screen.getByRole("textbox", { name: /cost basis/i });

    fireEvent.change(unitsField, { target: { value: "100" } });
    fireEvent.change(costBasisField, { target: { value: "15000" } });

    const submitButton = screen.getByRole("button", { name: /save position/i });
    fireEvent.click(submitButton);

    expect(onSave).toHaveBeenCalledWith(100, 15000);
  });

  it("allows cost basis to be optional", () => {
    const onSave = vi.fn();
    render(<EditPositionForm listItem={mockListItem} quote={mockQuote} onSave={onSave} />);

    const unitsField = screen.getByRole("textbox", { name: /units/i });
    const costBasisField = screen.getByRole("textbox", { name: /cost basis/i });

    fireEvent.change(unitsField, { target: { value: "100" } });
    fireEvent.change(costBasisField, { target: { value: "" } });

    const submitButton = screen.getByRole("button", { name: /save position/i });
    fireEvent.click(submitButton);

    expect(onSave).toHaveBeenCalledWith(100, undefined);
  });
});
