import { ActionPanel, Action, Icon, List, Color, getPreferenceValues } from "@raycast/api";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { parseSymbols } from "./utils/symbols";
import { getQuotes, QuoteResult } from "./data/quotes";
import { startRefresher } from "./utils/refresher";

type Preferences = {
  stockSymbols?: string;
};

export default function Command() {
  const preferences = getPreferenceValues<Preferences>();
  const symbols = useMemo(() => parseSymbols(preferences.stockSymbols), [preferences.stockSymbols]);
  const [items, setItems] = useState<QuoteResult[]>([]);
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
          if (!item.ok) {
            return (
              <List.Item
                key={item.symbol}
                icon={Icon.ExclamationMark}
                title={item.symbol}
                subtitle={item.error}
                accessories={[{ text: "Error" }]}
                actions={
                  <ActionPanel>
                    <Action.OpenInBrowser
                      title="Open in Yahoo Finance"
                      url={`https://finance.yahoo.com/quote/${encodeURIComponent(item.symbol)}`}
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
          const up = ch != null && ch >= 0;
          const color = up ? Color.Green : Color.Red;
          const arrow = up ? "▲" : "▼";
          return (
            <List.Item
              key={data.symbol}
              icon={Icon.LineChart}
              title={data.symbol}
              subtitle={data.shortName ?? ""}
              accessories={[
                { text: price != null ? `$${price.toFixed(2)}` : "-" },
                { tag: { value: `${arrow} ${formatChange(ch, chp)}`, color } },
              ]}
              actions={
                <ActionPanel>
                  <Action.OpenInBrowser
                    title="Open in Yahoo Finance"
                    url={`https://finance.yahoo.com/quote/${encodeURIComponent(data.symbol)}`}
                  />
                  <Action.CopyToClipboard title="Copy Symbol" content={data.symbol} />
                </ActionPanel>
              }
            />
          );
        })
      )}
    </List>
  );
}
