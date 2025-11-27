/**
 * Add Stock command - Search for stocks and add them to lists
 */

import {
  Action,
  ActionPanel,
  Alert,
  confirmAlert,
  Form,
  Icon,
  List,
  showToast,
  Toast,
  useNavigation,
} from "@raycast/api";
import { useEffect, useState } from "react";
import { searchStocks, type SearchResult } from "./data/search";
import { loadLists, loadSettings, saveLists, saveSettings } from "./data/lists";
import type { ListItem, StockList, UserSettings } from "./types";

export default function AddStock() {
  const [searchText, setSearchText] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [lists, setLists] = useState<StockList[]>([]);
  const [settings, setSettings] = useState<UserSettings>({ defaultListId: null });
  const [isLoadingData, setIsLoadingData] = useState(true);

  // Load lists and settings on mount
  useEffect(() => {
    async function load() {
      const [loadedLists, loadedSettings] = await Promise.all([loadLists(), loadSettings()]);
      setLists(loadedLists);
      setSettings(loadedSettings);
      setIsLoadingData(false);
    }
    load();
  }, []);

  // Perform search when text changes
  useEffect(() => {
    async function search() {
      if (!searchText.trim()) {
        setSearchResults([]);
        return;
      }

      setIsSearching(true);
      const results = await searchStocks(searchText);
      setSearchResults(results);
      setIsSearching(false);
    }

    const timeoutId = setTimeout(search, 300); // Debounce search
    return () => clearTimeout(timeoutId);
  }, [searchText]);

  async function addToList(result: SearchResult, listId: string) {
    const list = lists.find((l) => l.id === listId);
    if (!list) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "List not found",
      });
      return;
    }

    // Check for duplicates
    if (list.symbols.some((item) => item.symbol === result.symbol)) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Already Exists",
        message: `${result.symbol} is already in "${list.name}"`,
      });
      return;
    }

    // Add the stock
    const newItem: ListItem = { symbol: result.symbol };
    const updatedList = {
      ...list,
      symbols: [...list.symbols, newItem],
      updatedAt: Date.now(),
    };

    const updatedLists = lists.map((l) => (l.id === listId ? updatedList : l));
    await saveLists(updatedLists);
    setLists(updatedLists);

    // Update default list
    const updatedSettings = { ...settings, defaultListId: listId };
    await saveSettings(updatedSettings);
    setSettings(updatedSettings);

    await showToast({
      style: Toast.Style.Success,
      title: "Stock Added",
      message: `${result.symbol} added to "${list.name}"`,
    });

    return { list: updatedList, lists: updatedLists };
  }

  function getDefaultList(): StockList | null {
    if (settings.defaultListId) {
      const list = lists.find((l) => l.id === settings.defaultListId);
      if (list) return list;
    }
    return lists.length > 0 ? lists[0] : null;
  }

  const defaultList = getDefaultList();
  const hasMultipleLists = lists.length > 1;

  return (
    <List
      isLoading={isLoadingData || isSearching}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder="Search for stocks, ETFs, crypto..."
      throttle
    >
      {searchResults.length === 0 && searchText.trim() === "" && (
        <List.EmptyView
          icon={Icon.MagnifyingGlass}
          title="Search for Stocks"
          description="Enter a company name or ticker symbol to search"
        />
      )}

      {searchResults.length === 0 && searchText.trim() !== "" && !isSearching && (
        <List.EmptyView
          icon={Icon.XMarkCircle}
          title="No Results"
          description={`No stocks found for "${searchText}"`}
        />
      )}

      {lists.length === 0 && !isLoadingData && (
        <List.EmptyView icon={Icon.List} title="No Lists" description="Create a list first in Manage Lists command" />
      )}

      {searchResults.map((result) => (
        <List.Item
          key={result.symbol}
          title={result.symbol}
          subtitle={result.name}
          accessories={[result.price ? { text: `$${result.price.toFixed(2)}` } : {}, { text: result.type }]}
          actions={
            lists.length > 0 ? (
              <ActionPanel>
                <ActionPanel.Section title="Add to List">
                  {defaultList && (
                    <Action
                      title={`Add to ${defaultList.name}`}
                      icon={Icon.Plus}
                      onAction={() => addToList(result, defaultList.id)}
                    />
                  )}
                  {hasMultipleLists && (
                    <Action.Push
                      title="Add to List…"
                      icon={Icon.List}
                      shortcut={{ modifiers: ["cmd"], key: "l" }}
                      target={
                        <ListPickerView
                          result={result}
                          lists={lists}
                          onSelect={(listId) => addToList(result, listId)}
                        />
                      }
                    />
                  )}
                  <AddWithPositionAction result={result} lists={lists} defaultList={defaultList} />
                </ActionPanel.Section>

                <ActionPanel.Section>
                  <Action.OpenInBrowser
                    title="View in Yahoo Finance"
                    icon={Icon.Globe}
                    shortcut={{ modifiers: ["cmd"], key: "o" }}
                    url={`https://finance.yahoo.com/quote/${result.symbol}`}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            ) : undefined
          }
        />
      ))}
    </List>
  );
}

/**
 * List picker view for selecting which list to add stock to
 */
function ListPickerView({
  result,
  lists,
  onSelect,
}: {
  result: SearchResult;
  lists: StockList[];
  onSelect: (listId: string) => Promise<void>;
}) {
  const { pop } = useNavigation();

  async function handleSelect(listId: string) {
    await onSelect(listId);
    pop();
  }

  return (
    <List navigationTitle={`Add ${result.symbol} to...`} searchBarPlaceholder="Search lists...">
      {lists.map((list) => {
        const itemCount = list.symbols.length;
        const hasStock = list.symbols.some((item) => item.symbol === result.symbol);

        return (
          <List.Item
            key={list.id}
            title={`${list.icon} ${list.name}`}
            subtitle={`${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            accessories={hasStock ? [{ text: "Already added", icon: Icon.CheckCircle }] : []}
            actions={
              !hasStock ? (
                <ActionPanel>
                  <Action title={`Add to ${list.name}`} icon={Icon.Plus} onAction={() => handleSelect(list.id)} />
                </ActionPanel>
              ) : undefined
            }
          />
        );
      })}
    </List>
  );
}

/**
 * Action for adding stock with position (units and cost basis)
 */
function AddWithPositionAction({
  result,
  lists,
  defaultList,
}: {
  result: SearchResult;
  lists: StockList[];
  defaultList: StockList | null;
}) {
  // Only show for portfolio lists
  const portfolioLists = lists.filter((l) => l.isPortfolio);
  if (portfolioLists.length === 0) return null;

  const targetList = defaultList?.isPortfolio ? defaultList : portfolioLists[0];

  return (
    <Action.Push
      title="Add with Position…"
      icon={Icon.Pencil}
      shortcut={{ modifiers: ["cmd"], key: "e" }}
      target={<PositionForm result={result} lists={portfolioLists} defaultList={targetList} />}
    />
  );
}

/**
 * Form for entering position details (units and cost basis)
 */
function PositionForm({
  result,
  lists,
  defaultList,
}: {
  result: SearchResult;
  lists: StockList[];
  defaultList: StockList;
}) {
  const { pop } = useNavigation();
  const [unitsError, setUnitsError] = useState<string | undefined>();
  const [costError, setCostError] = useState<string | undefined>();

  async function handleSubmit(values: { listId: string; units: string; costBasis: string }) {
    const units = parseFloat(values.units);
    const costBasis = parseFloat(values.costBasis);

    // Validate inputs
    if (isNaN(units) || units <= 0) {
      setUnitsError("Must be a positive number");
      return;
    }
    if (isNaN(costBasis) || costBasis <= 0) {
      setCostError("Must be a positive number");
      return;
    }

    const list = lists.find((l) => l.id === values.listId);
    if (!list) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Error",
        message: "List not found",
      });
      return;
    }

    // Check for duplicates
    if (list.symbols.some((item) => item.symbol === result.symbol)) {
      const confirmed = await confirmAlert({
        title: `${result.symbol} Already Exists`,
        message: `Do you want to update the position in "${list.name}"?`,
        primaryAction: {
          title: "Update",
          style: Alert.ActionStyle.Default,
        },
      });

      if (!confirmed) return;

      // Update existing item
      const updatedList = {
        ...list,
        symbols: list.symbols.map((item) => (item.symbol === result.symbol ? { ...item, units, costBasis } : item)),
        updatedAt: Date.now(),
      };

      const allLists = await loadLists();
      const updatedLists = allLists.map((l) => (l.id === values.listId ? updatedList : l));
      await saveLists(updatedLists);

      await showToast({
        style: Toast.Style.Success,
        title: "Position Updated",
        message: `${result.symbol} in "${list.name}"`,
      });
    } else {
      // Add new item
      const newItem: ListItem = { symbol: result.symbol, units, costBasis };
      const updatedList = {
        ...list,
        symbols: [...list.symbols, newItem],
        updatedAt: Date.now(),
      };

      const allLists = await loadLists();
      const updatedLists = allLists.map((l) => (l.id === values.listId ? updatedList : l));
      await saveLists(updatedLists);

      // Update default list
      const settings = await loadSettings();
      await saveSettings({ ...settings, defaultListId: values.listId });

      await showToast({
        style: Toast.Style.Success,
        title: "Stock Added",
        message: `${result.symbol} added to "${list.name}"`,
      });
    }

    pop();
  }

  return (
    <Form
      navigationTitle={`Add ${result.symbol} with Position`}
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Add to Portfolio" icon={Icon.CheckCircle} onSubmit={handleSubmit} />
          <Action title="Cancel" icon={Icon.XMarkCircle} onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description title="Stock" text={`${result.symbol} - ${result.name}`} />

      <Form.Dropdown id="listId" title="Portfolio" defaultValue={defaultList.id}>
        {lists.map((list) => (
          <Form.Dropdown.Item
            key={list.id}
            value={list.id}
            title={`${list.icon} ${list.name}`}
            icon={list.symbols.some((item) => item.symbol === result.symbol) ? Icon.CheckCircle : undefined}
          />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="units"
        title="Units"
        placeholder="e.g., 10"
        info="Number of shares/units owned"
        error={unitsError}
        onChange={() => setUnitsError(undefined)}
      />

      <Form.TextField
        id="costBasis"
        title="Total Cost"
        placeholder="e.g., 1500.00"
        info="Total amount paid (for P&L calculation)"
        error={costError}
        onChange={() => setCostError(undefined)}
      />

      {result.price && (
        <Form.Description
          text={`Current price: $${result.price.toFixed(2)}\nSuggested cost for 1 unit: $${result.price.toFixed(2)}`}
        />
      )}
    </Form>
  );
}
