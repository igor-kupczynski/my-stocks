/**
 * Manage Lists command - Create, edit, reorder, and delete stock lists
 */

import { Action, ActionPanel, Alert, confirmAlert, Icon, List, showToast, Toast, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import ListForm, { type ListFormValues } from "./components/ListForm";
import { loadLists, saveLists } from "./data/lists";
import type { StockList } from "./types";

export default function ManageLists() {
  const [lists, setLists] = useState<StockList[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const loadedLists = await loadLists();
      setLists(loadedLists);
      setIsLoading(false);
    }
    load();
  }, []);

  async function handleCreateList(values: ListFormValues) {
    const newList: StockList = {
      id: crypto.randomUUID(),
      name: values.name,
      icon: values.icon,
      symbols: [],
      isPortfolio: values.isPortfolio,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedLists = [...lists, newList];
    await saveLists(updatedLists);
    setLists(updatedLists);

    await showToast({
      style: Toast.Style.Success,
      title: "List Created",
      message: `"${newList.name}" has been created`,
    });
  }

  async function handleEditList(listId: string, values: ListFormValues) {
    const updatedLists = lists.map((list) =>
      list.id === listId
        ? {
            ...list,
            name: values.name,
            icon: values.icon,
            isPortfolio: values.isPortfolio,
            updatedAt: Date.now(),
          }
        : list,
    );

    await saveLists(updatedLists);
    setLists(updatedLists);

    await showToast({
      style: Toast.Style.Success,
      title: "List Updated",
      message: `"${values.name}" has been saved`,
    });
  }

  async function handleDeleteList(list: StockList) {
    const hasItems = list.symbols.length > 0;
    const confirmed = await confirmAlert({
      title: `Delete "${list.name}"?`,
      message: hasItems
        ? `This list contains ${list.symbols.length} ${list.symbols.length === 1 ? "stock" : "stocks"}. This action cannot be undone.`
        : "This action cannot be undone.",
      primaryAction: {
        title: "Delete",
        style: Alert.ActionStyle.Destructive,
      },
    });

    if (!confirmed) return;

    const updatedLists = lists.filter((l) => l.id !== list.id);
    await saveLists(updatedLists);
    setLists(updatedLists);

    await showToast({
      style: Toast.Style.Success,
      title: "List Deleted",
      message: `"${list.name}" has been removed`,
    });
  }

  async function handleDuplicateList(list: StockList) {
    const duplicatedList: StockList = {
      ...list,
      id: crypto.randomUUID(),
      name: `${list.name} (Copy)`,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    const updatedLists = [...lists, duplicatedList];
    await saveLists(updatedLists);
    setLists(updatedLists);

    await showToast({
      style: Toast.Style.Success,
      title: "List Duplicated",
      message: `Created "${duplicatedList.name}"`,
    });
  }

  async function handleMoveUp(index: number) {
    if (index <= 0) return;

    const updatedLists = [...lists];
    [updatedLists[index - 1], updatedLists[index]] = [updatedLists[index], updatedLists[index - 1]];

    await saveLists(updatedLists);
    setLists(updatedLists);
  }

  async function handleMoveDown(index: number) {
    if (index >= lists.length - 1) return;

    const updatedLists = [...lists];
    [updatedLists[index], updatedLists[index + 1]] = [updatedLists[index + 1], updatedLists[index]];

    await saveLists(updatedLists);
    setLists(updatedLists);
  }

  return (
    <List isLoading={isLoading} searchBarPlaceholder="Search lists...">
      <List.Item
        key="create-new"
        title="Create New List"
        icon={Icon.Plus}
        accessories={[{ text: "Create a new watchlist or portfolio" }]}
        actions={
          <ActionPanel>
            <Action.Push
              title="Create New List"
              icon={Icon.Plus}
              target={<CreateListView onSubmit={handleCreateList} />}
            />
          </ActionPanel>
        }
      />

      {lists.length === 0 && !isLoading && (
        <List.EmptyView
          icon={Icon.List}
          title="No Lists Yet"
          description="Create your first watchlist or portfolio to start tracking stocks"
        />
      )}

      {lists.map((list, index) => {
        const itemCount = list.symbols.length;
        const typeLabel = list.isPortfolio ? "Portfolio" : "Watchlist";

        return (
          <List.Item
            key={list.id}
            title={`${list.icon} ${list.name}`}
            subtitle={`${itemCount} ${itemCount === 1 ? "item" : "items"}`}
            accessories={[{ text: typeLabel }]}
            actions={
              <ActionPanel>
                <ActionPanel.Section title="List Actions">
                  <Action.Push
                    title="Edit List"
                    icon={Icon.Pencil}
                    shortcut={{ modifiers: ["cmd"], key: "e" }}
                    target={<EditListView list={list} onSubmit={(values) => handleEditList(list.id, values)} />}
                  />
                  <Action
                    title="Duplicate List"
                    icon={Icon.Duplicate}
                    shortcut={{ modifiers: ["cmd"], key: "d" }}
                    onAction={() => handleDuplicateList(list)}
                  />
                  <Action
                    title="Delete List"
                    icon={Icon.Trash}
                    style={Action.Style.Destructive}
                    shortcut={{ modifiers: ["cmd"], key: "backspace" }}
                    onAction={() => handleDeleteList(list)}
                  />
                </ActionPanel.Section>

                <ActionPanel.Section title="Reorder">
                  <Action
                    title="Move up"
                    icon={Icon.ArrowUp}
                    shortcut={{ modifiers: ["cmd"], key: "arrowUp" }}
                    onAction={() => handleMoveUp(index)}
                  />
                  <Action
                    title="Move Down"
                    icon={Icon.ArrowDown}
                    shortcut={{ modifiers: ["cmd"], key: "arrowDown" }}
                    onAction={() => handleMoveDown(index)}
                  />
                </ActionPanel.Section>
              </ActionPanel>
            }
          />
        );
      })}
    </List>
  );
}

function CreateListView({ onSubmit }: { onSubmit: (values: ListFormValues) => Promise<void> }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: ListFormValues) {
    await onSubmit(values);
    pop();
  }

  return <ListForm onSubmit={handleSubmit} onCancel={pop} />;
}

function EditListView({ list, onSubmit }: { list: StockList; onSubmit: (values: ListFormValues) => Promise<void> }) {
  const { pop } = useNavigation();

  async function handleSubmit(values: ListFormValues) {
    await onSubmit(values);
    pop();
  }

  return <ListForm list={list} onSubmit={handleSubmit} onCancel={pop} />;
}
