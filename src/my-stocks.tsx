import { ActionPanel, Action, Icon, List, Color, getPreferenceValues, open } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseSymbols } from "./utils/symbols";
import { getQuotes, Quote } from "./data/quotes";
import { startRefresher } from "./utils/refresher";

type Preferences = {
  stockSymbols?: string;
};

type Item =
  | (Quote & { error?: undefined })
  | { symbol: string; error: string; shortName?: undefined; regularMarketPrice?: undefined; regularMarketChange?: undefined; regularMarketChangePercent?: undefined };

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const symbols = useMemo(() => parseSymbols(preferences.stockSymbols), [preferences.stockSymbols]);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
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
      setItems(results as Item[]);
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

  const openInStocks = useCallback(async (symbol: string) => {
    try {
      await open(`stocks://symbol=${encodeURIComponent(symbol)}`);
    } catch {
      await open(`https://finance.yahoo.com/quote/${encodeURIComponent(symbol)}`);
    }
  }, []);

  const formatChange = (change?: number, percent?: number) => {
    if (change == null || percent == null) return "";
    const sign = change >= 0 ? "+" : "";
    return `${sign}${change.toFixed(2)} (${sign}${percent.toFixed(2)}%)`;
  };

  return (
    <List isLoading={loading} searchBarPlaceholder="Filter symbols...">
      {symbols.length === 0 && !loading ? (
        <List.EmptyView
          title="No stocks configured"
          description="Set a comma-separated list of stock symbols in the command preferences."
        />
      ) : (
        items.map((item) => {
          const hasError = (item as any).error;
          const price = hasError ? undefined : (item as Quote).regularMarketPrice;
          const ch = hasError ? undefined : (item as Quote).regularMarketChange;
          const chp = hasError ? undefined : (item as Quote).regularMarketChangePercent;
          const up = ch != null && ch >= 0;
          const color = up ? Color.Green : Color.Red;
          const arrow = up ? "▲" : "▼";
          const subtitle = hasError ? (item as any).error : (item as Quote).shortName ?? "";
          const accessories = hasError
            ? [{ text: "Error" }]
            : [
                { text: price != null ? `$${price.toFixed(2)}` : "-" },
                { tag: { value: `${arrow} ${formatChange(ch, chp)}`, color } },
              ];
          return (
            <List.Item
              key={item.symbol}
              icon={hasError ? Icon.ExclamationMark : Icon.ChartLine}
              title={item.symbol}
              subtitle={subtitle}
              accessories={accessories as any}
              actions={
                <ActionPanel>
                  <Action title="Open in Stocks" icon={Icon.AppWindow} onAction={() => openInStocks(item.symbol)} />
                  <Action.OpenInBrowser
                    title="Open in Yahoo Finance"
                    url={`https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`}
                  />
                  <Action.CopyToClipboard title="Copy Symbol" content={item.symbol} />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
