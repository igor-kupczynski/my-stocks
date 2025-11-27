import { List } from "@raycast/api";
import type { StockList } from "../types";
import type { Quote } from "../data/quotes";

function formatCurrency(value: number | undefined, currency = "USD"): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

interface PortfolioStats {
  totalValue: number;
  dayPL: number;
  currency: string;
}

function calculatePortfolioStats(list: StockList, quotes: Map<string, Quote>): PortfolioStats | null {
  if (!list.isPortfolio) return null;

  let totalValue = 0;
  let dayPL = 0;
  let currency = "USD";

  for (const item of list.symbols) {
    const quote = quotes.get(item.symbol);
    if (!quote || !item.units) continue;

    const price = quote.regularMarketPrice;
    const change = quote.regularMarketChange;

    if (price != null) {
      totalValue += item.units * price;
      currency = quote.currency ?? "USD";
    }

    if (change != null) {
      dayPL += item.units * change;
    }
  }

  return { totalValue, dayPL, currency };
}

interface ListSectionProps {
  list: StockList;
  quotes: Map<string, Quote>;
  children: React.ReactNode;
}

export function ListSection({ list, quotes, children }: ListSectionProps) {
  const stats = calculatePortfolioStats(list, quotes);
  const itemCount = list.symbols.length;

  let subtitle = `${itemCount} ${itemCount === 1 ? "item" : "items"}`;

  if (stats) {
    const plSign = stats.dayPL >= 0 ? "+" : "";
    subtitle = `${formatCurrency(stats.totalValue, stats.currency)}  Day: ${plSign}${formatCurrency(stats.dayPL, stats.currency)}`;
  }

  return (
    <List.Section title={`${list.icon} ${list.name}`} subtitle={subtitle}>
      {children}
    </List.Section>
  );
}
