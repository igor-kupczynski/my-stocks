import { ActionPanel, Action, Icon, List, Color, getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseSymbols } from "./utils/symbols";
import { getQuotes, Quote, QuoteResult } from "./data/quotes";
import { startRefresher } from "./utils/refresher";

type Preferences = {
  stockSymbols?: string;
};

function formatNumber(value: number | undefined, decimals = 2): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

function formatCurrency(value: number | undefined, currency = "USD"): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatLargeNumber(value: number | undefined): string {
  if (value == null) return "—";
  if (value >= 1e12) return `${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(2)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(2)}K`;
  return value.toFixed(0);
}

function formatVolume(value: number | undefined): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US");
}

function formatPercentChange(percent?: number): string {
  if (percent == null) return "";
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
}

function formatPriceChange(change?: number, percent?: number): string {
  if (change == null || percent == null) return "—";
  const sign = change >= 0 ? "+" : "";
  return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
}

function getPerformanceIndicator(change?: number): { icon: Icon; tintColor: Color } {
  if (change == null) return { icon: Icon.Minus, tintColor: Color.SecondaryText };
  if (change > 0) return { icon: Icon.ArrowUpCircleFilled, tintColor: Color.Green };
  if (change < 0) return { icon: Icon.ArrowDownCircleFilled, tintColor: Color.Red };
  return { icon: Icon.MinusCircle, tintColor: Color.SecondaryText };
}

function formatMarketTime(date?: Date): string {
  if (!date) return "—";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function StockDetail({ data }: { data: Quote }) {
  const currency = data.currency ?? "USD";

  return (
    <List.Item.Detail
      metadata={
        <List.Item.Detail.Metadata>
          <List.Item.Detail.Metadata.Label title="As of" text={formatMarketTime(data.regularMarketTime)} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Open" text={formatCurrency(data.regularMarketOpen, currency)} />
          <List.Item.Detail.Metadata.Label title="High" text={formatCurrency(data.regularMarketDayHigh, currency)} />
          <List.Item.Detail.Metadata.Label title="Low" text={formatCurrency(data.regularMarketDayLow, currency)} />
          <List.Item.Detail.Metadata.Label title="Close" text={formatCurrency(data.regularMarketPreviousClose, currency)} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="52W High" text={formatCurrency(data.fiftyTwoWeekHigh, currency)} />
          <List.Item.Detail.Metadata.Label title="52W Low" text={formatCurrency(data.fiftyTwoWeekLow, currency)} />
          <List.Item.Detail.Metadata.Separator />
          <List.Item.Detail.Metadata.Label title="Volume" text={formatLargeNumber(data.regularMarketVolume)} />
          <List.Item.Detail.Metadata.Label title="Mkt Cap" text={formatLargeNumber(data.marketCap)} />
        </List.Item.Detail.Metadata>
      }
    />
  );
}

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const symbols = useMemo(() => parseSymbols(preferences.stockSymbols), [preferences.stockSymbols]);
  const [items, setItems] = useState<QuoteResult[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!mounted.current) return;
    if (symbols.length === 0) {
      setItems([]);
      setLoading(false);
      return;
    }
    try {
      const results = await getQuotes(symbols);
      if (!mounted.current) return;
      setItems(results);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, [symbols]);

  useEffect(() => {
    mounted.current = true;
    const dispose = startRefresher(() => {
      void refresh();
    }, 60_000);
    return () => {
      mounted.current = false;
      dispose();
    };
  }, [refresh]);

  const toggleDetail = useCallback(() => setShowDetail((prev) => !prev), []);

  return (
    <List isLoading={loading} isShowingDetail={showDetail} searchBarPlaceholder="Filter symbols...">
      {symbols.length === 0 && !loading ? (
        <List.EmptyView
          icon={Icon.BarChart}
          title="No stocks configured"
          description="Set a comma-separated list of stock symbols in the command preferences."
        />
      ) : (
        items.map((item) => {
          if (!item.ok) {
            return (
              <List.Item
                key={item.symbol}
                icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
                title={item.symbol}
                subtitle={item.error}
                detail={
                  <List.Item.Detail
                    markdown={`# ${item.symbol}\n\n⚠️ **Error**: ${item.error}`}
                  />
                }
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open in Yahoo Finance"
                    url={`https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`}
                  />
                  <Action
                    title={showDetail ? "Hide Details" : "Show Details"}
                    icon={Icon.Sidebar}
                    onAction={toggleDetail}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                  <Action.CopyToClipboard title="Copy Symbol" content={item.symbol} />
                </ActionPanel>
              }
              />
            );
          }
          const { data } = item;
          const price = data.regularMarketPrice;
          const ch = data.regularMarketChange;
          const chp = data.regularMarketChangePercent;
          const { icon, tintColor } = getPerformanceIndicator(ch);

          return (
            <List.Item
              key={data.symbol}
              icon={{ source: icon, tintColor }}
              title={data.symbol}
              subtitle={data.shortName ?? ""}
              accessories={[
                { text: price != null ? `$${formatNumber(price)}` : "—" },
                { tag: { value: formatPercentChange(chp), color: tintColor } },
              ]}
              detail={<StockDetail data={data} />}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open in Yahoo Finance"
                    url={`https://finance.yahoo.com/quote/${encodeURIComponent(data.symbol)}`}
                  />
                  <Action
                    title={showDetail ? "Hide Details" : "Show Details"}
                    icon={Icon.Sidebar}
                    onAction={toggleDetail}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                  />
                  <Action.CopyToClipboard title="Copy Symbol" content={data.symbol} />
                  <Action.CopyToClipboard
                    title="Copy Price"
                    content={price != null ? price.toFixed(2) : ""}
                    shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
                  />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
