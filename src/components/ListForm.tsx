/**
 * Form component for creating or editing stock lists
 */

import { Action, ActionPanel, Form, Icon } from "@raycast/api";
import { useState } from "react";
import type { StockList } from "../types";

interface ListFormProps {
  /** Existing list to edit (undefined for create mode) */
  list?: StockList;
  /** Callback when form is submitted */
  onSubmit: (values: ListFormValues) => void;
  /** Callback when form is cancelled */
  onCancel?: () => void;
}

export interface ListFormValues {
  name: string;
  icon: string;
  isPortfolio: boolean;
}

// Icon suggestions for the dropdown
const ICON_OPTIONS = [
  { value: "📋", title: "📋 Watchlist" },
  { value: "💼", title: "💼 Portfolio" },
  { value: "📈", title: "📈 Stocks" },
  { value: "🪙", title: "🪙 Crypto" },
  { value: "💰", title: "💰 ETFs" },
  { value: "🏦", title: "🏦 Banking" },
  { value: "🌍", title: "🌍 International" },
  { value: "⭐", title: "⭐ Favorites" },
  { value: "🔬", title: "🔬 Research" },
];

export default function ListForm({ list, onSubmit, onCancel }: ListFormProps) {
  const isEditMode = !!list;
  const [nameError, setNameError] = useState<string | undefined>();

  function handleSubmit(values: ListFormValues) {
    // Validate name is not empty
    if (!values.name.trim()) {
      setNameError("Name is required");
      return;
    }

    onSubmit({
      name: values.name.trim(),
      icon: values.icon,
      isPortfolio: values.isPortfolio,
    });
  }

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title={isEditMode ? "Save Changes" : "Create List"}
            icon={Icon.CheckCircle}
            onSubmit={handleSubmit}
          />
          {onCancel && <Action title="Cancel" icon={Icon.XMarkCircle} onAction={onCancel} />}
        </ActionPanel>
      }
    >
      <Form.Dropdown id="icon" title="Icon" defaultValue={list?.icon || "📋"} info="Emoji to represent this list">
        {ICON_OPTIONS.map((option) => (
          <Form.Dropdown.Item key={option.value} value={option.value} title={option.title} />
        ))}
      </Form.Dropdown>

      <Form.TextField
        id="name"
        title="Name"
        placeholder="e.g., Tech Stocks, Retirement Portfolio"
        defaultValue={list?.name || ""}
        error={nameError}
        onChange={() => setNameError(undefined)}
        info="Display name for this list"
      />

      <Form.Dropdown
        id="isPortfolio"
        title="Type"
        defaultValue={list?.isPortfolio ? "true" : "false"}
        info="Portfolio mode shows units, value, and P&L columns"
      >
        <Form.Dropdown.Item value="false" title="Watchlist (prices only)" icon="📋" />
        <Form.Dropdown.Item value="true" title="Portfolio (track positions)" icon="💼" />
      </Form.Dropdown>

      <Form.Description
        text={isEditMode ? "Changes will be saved immediately." : "You can add stocks to this list after creating it."}
      />
    </Form>
  );
}
