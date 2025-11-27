import { ActionPanel, Action, Icon, List, Color, confirmAlert, Alert } from "@raycast/api";
import { useCallback, useEffect, useRef, useState } from "react";
import { getQuotes, Quote } from "./data/quotes";
import { startRefresher } from "./utils/refresher";
import { loadLists, saveLists } from "./data/lists";
import type { StockList, ListItem } from "./types";
import { ListSection } from "./components/ListSection";
import { StockItem } from "./components/StockItem";

export default function Command() {
  const [lists, setLists] = useState<StockList[]>([]);
  const [quotes, setQuotes] = useState<Map<string, Quote>>(new Map());
  const [loading, setLoading] = useState<boolean>(true);
  const [showDetail, setShowDetail] = useState<boolean>(false);
  const mounted = useRef(true);

  const refresh = useCallback(async () => {
    if (!mounted.current) return;

    try {
      // Load lists from LocalStorage
      const loadedLists = await loadLists();
      if (!mounted.current) return;
      setLists(loadedLists);

      // Extract all unique symbols from all lists
      const allSymbols = new Set<string>();
      for (const list of loadedLists) {
        for (const item of list.symbols) {
          allSymbols.add(item.symbol);
        }
      }

      if (allSymbols.size === 0) {
        setQuotes(new Map());
        setLoading(false);
        return;
      }

      try {
        const results = await getQuotes(Array.from(allSymbols));
        if (!mounted.current) return;

        // Build quote map (only successful quotes)
        const quoteMap = new Map<string, Quote>();
        for (const result of results) {
          if (result.ok) {
            quoteMap.set(result.data.symbol, result.data);
          }
        }
        setQuotes(quoteMap);
      } catch (error) {
        // Log error but don't crash - quotes will remain stale
        console.error("Failed to fetch quotes:", error);
        // Keep existing quotes on error to maintain stale data
      }
    } catch (error) {
      // Handle LocalStorage or list loading errors
      console.error("Failed to load lists:", error);
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mounted.current = true;
    const dispose = startRefresher(() => {
      void refresh();
    }, 60_000);
    return () => {
      mounted.current = false;
      try {
        dispose();
      } catch (error) {
        console.error("Failed to dispose refresher:", error);
      }
    };
  }, [refresh]);

  const toggleDetail = useCallback(() => setShowDetail((prev) => !prev), []);

  // Move stock up in list
  const handleMoveUp = useCallback(
    async (listId: string, symbolIndex: number) => {
      if (symbolIndex === 0) return;

      const updatedLists = lists.map((list) => {
        if (list.id !== listId) return list;

        const newSymbols = [...list.symbols];
        [newSymbols[symbolIndex - 1], newSymbols[symbolIndex]] = [newSymbols[symbolIndex], newSymbols[symbolIndex - 1]];

        return {
          ...list,
          symbols: newSymbols,
          updatedAt: Date.now(),
        };
      });

      setLists(updatedLists);
      await saveLists(updatedLists);
    },
    [lists],
  );

  // Move stock down in list
  const handleMoveDown = useCallback(
    async (listId: string, symbolIndex: number) => {
      const list = lists.find((l) => l.id === listId);
      if (!list || symbolIndex === list.symbols.length - 1) return;

      const updatedLists = lists.map((l) => {
        if (l.id !== listId) return l;

        const newSymbols = [...l.symbols];
        [newSymbols[symbolIndex], newSymbols[symbolIndex + 1]] = [newSymbols[symbolIndex + 1], newSymbols[symbolIndex]];

        return {
          ...l,
          symbols: newSymbols,
          updatedAt: Date.now(),
        };
      });

      setLists(updatedLists);
      await saveLists(updatedLists);
    },
    [lists],
  );

  // Move stock to another list
  const handleMoveToList = useCallback(
    async (sourceListId: string, symbolIndex: number, targetListId: string) => {
      const sourceList = lists.find((l) => l.id === sourceListId);
      if (!sourceList || targetListId === sourceListId) return;

      const listItem = sourceList.symbols[symbolIndex];

      const updatedLists = lists.map((list) => {
        if (list.id === sourceListId) {
          // Remove from source list
          return {
            ...list,
            symbols: list.symbols.filter((_, i) => i !== symbolIndex),
            updatedAt: Date.now(),
          };
        }
        if (list.id === targetListId) {
          // Add to target list (preserve position data if both are portfolios)
          const itemToAdd: ListItem =
            sourceList.isPortfolio && list.isPortfolio ? listItem : { symbol: listItem.symbol }; // Drop position data if moving to watchlist

          return {
            ...list,
            symbols: [...list.symbols, itemToAdd],
            updatedAt: Date.now(),
          };
        }
        return list;
      });

      setLists(updatedLists);
      await saveLists(updatedLists);
    },
    [lists],
  );

  // Remove stock from list
  const handleRemove = useCallback(
    async (listId: string, symbolIndex: number) => {
      const list = lists.find((l) => l.id === listId);
      if (!list) return;

      const item = list.symbols[symbolIndex];
      const hasPosition = item.units !== undefined && item.units > 0;

      let message = `Remove ${item.symbol} from ${list.name}?`;
      if (hasPosition) {
        message = `This will also delete your position data (${item.units} shares). This action cannot be undone.`;
      }

      const confirmed = await confirmAlert({
        title: "Remove Stock",
        message,
        primaryAction: {
          title: "Remove",
          style: Alert.ActionStyle.Destructive,
        },
      });

      if (!confirmed) return;

      const updatedLists = lists.map((l) => {
        if (l.id !== listId) return l;

        return {
          ...l,
          symbols: l.symbols.filter((_, i) => i !== symbolIndex),
          updatedAt: Date.now(),
        };
      });

      setLists(updatedLists);
      await saveLists(updatedLists);
    },
    [lists],
  );

  const totalStocks = lists.reduce((sum, list) => sum + list.symbols.length, 0);

  return (
    <List isLoading={loading} isShowingDetail={showDetail} searchBarPlaceholder="Filter stocks...">
      {!loading && lists.length === 0 ? (
        <List.EmptyView
          icon={Icon.List}
          title="No lists yet"
          description="Use the Manage Lists command to create your first list, then add stocks to track."
          actions={
            <ActionPanel>
              <Action.Open
                title="Open Manage Lists"
                target="raycast://extensions/igor-kupczynski/my-stocks/manage-lists"
                icon={Icon.List}
              />
            </ActionPanel>
          }
        />
      ) : totalStocks === 0 && !loading ? (
        <List.EmptyView
          icon={Icon.BarChart}
          title="No stocks in your lists"
          description="Use the Add Stock command to add stocks to your lists."
          actions={
            <ActionPanel>
              <Action.Open
                title="Add Stock"
                target="raycast://extensions/igor-kupczynski/my-stocks/add-stock"
                icon={Icon.Plus}
              />
            </ActionPanel>
          }
        />
      ) : (
        lists.map((list) => (
          <ListSection key={list.id} list={list} quotes={quotes}>
            {list.symbols.map((listItem, index) => {
              const quote = quotes.get(listItem.symbol);

              // Handle missing quote (error case)
              if (!quote) {
                return (
                  <List.Item
                    key={`${list.id}-${listItem.symbol}`}
                    icon={{ source: Icon.ExclamationMark, tintColor: Color.Red }}
                    title={listItem.symbol}
                    subtitle="Failed to load quote"
                    actions={
                      <ActionPanel>
                        <Action.OpenInBrowser
                          title="Open in Yahoo Finance"
                          url={`https://finance.yahoo.com/quote/${encodeURIComponent(listItem.symbol)}`}
                        />
                        <Action
                          title="Remove from List"
                          icon={Icon.Trash}
                          style={Action.Style.Destructive}
                          onAction={() => handleRemove(list.id, index)}
                          shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                        />
                      </ActionPanel>
                    }
                  />
                );
              }

              return (
                <StockItem
                  key={`${list.id}-${listItem.symbol}`}
                  listItem={listItem}
                  quote={quote}
                  isPortfolio={list.isPortfolio}
                  showDetail={showDetail}
                  canMoveUp={index > 0}
                  canMoveDown={index < list.symbols.length - 1}
                  availableLists={lists.map((l) => ({ id: l.id, name: l.name, icon: l.icon }))}
                  currentListId={list.id}
                  onToggleDetail={toggleDetail}
                  onMoveUp={() => handleMoveUp(list.id, index)}
                  onMoveDown={() => handleMoveDown(list.id, index)}
                  onMoveToList={(targetListId: string) => handleMoveToList(list.id, index, targetListId)}
                  onRemove={() => handleRemove(list.id, index)}
                />
              );
            })}
          </ListSection>
        ))
      )}
    </List>
  );
}
