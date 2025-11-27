import { Action, ActionPanel, Form, useNavigation } from "@raycast/api";
import { useEffect, useState } from "react";
import type { Quote } from "../data/quotes";
import type { ListItem } from "../types";

interface EditPositionFormProps {
  listItem: ListItem;
  quote: Quote;
  onSave: (units: number | undefined, costBasis: number | undefined) => void;
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

function formatNumber(value: number | undefined, decimals = 2): string {
  if (value == null) return "—";
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

export function EditPositionForm({ listItem, quote, onSave }: EditPositionFormProps) {
  const { pop } = useNavigation();
  const [unitsValue, setUnitsValue] = useState<string>(listItem.units?.toString() ?? "");
  const [costBasisValue, setCostBasisValue] = useState<string>(listItem.costBasis?.toString() ?? "");
  const [unitsError, setUnitsError] = useState<string | undefined>();
  const [costBasisError, setCostBasisError] = useState<string | undefined>();

  const currency = quote.currency ?? "USD";
  const currentPrice = quote.regularMarketPrice;

  // Parse values for calculations
  const units = unitsValue.trim() === "" ? undefined : parseFloat(unitsValue);
  const costBasis = costBasisValue.trim() === "" ? undefined : parseFloat(costBasisValue);

  // Calculations
  const currentValue = units != null && currentPrice != null ? units * currentPrice : undefined;
  const unrealizedPL = currentValue != null && costBasis != null ? currentValue - costBasis : undefined;
  const unrealizedPLPercent =
    unrealizedPL != null && costBasis != null && costBasis !== 0 ? (unrealizedPL / costBasis) * 100 : undefined;
  const costPerShare = costBasis != null && units != null && units !== 0 ? costBasis / units : undefined;

  // Validate on change
  useEffect(() => {
    if (unitsValue.trim() !== "") {
      if (units === undefined || isNaN(units) || units < 0) {
        setUnitsError("Must be a positive number");
      } else {
        setUnitsError(undefined);
      }
    } else {
      setUnitsError(undefined);
    }
  }, [unitsValue, units]);

  useEffect(() => {
    if (costBasisValue.trim() !== "") {
      if (costBasis === undefined || isNaN(costBasis) || costBasis < 0) {
        setCostBasisError("Must be a positive number");
      } else {
        setCostBasisError(undefined);
      }
    } else {
      setCostBasisError(undefined);
    }
  }, [costBasisValue, costBasis]);

  const handleSubmit = () => {
    // If units is 0 or empty, clear both values to remove position data
    const finalUnits = units === 0 || units === undefined ? undefined : units;
    const finalCostBasis = finalUnits === undefined ? undefined : costBasis;

    onSave(finalUnits, finalCostBasis);
    pop();
  };

  const hasErrors = unitsError != null || costBasisError != null;

  return (
    <Form
      actions={
        <ActionPanel>
          <Action.SubmitForm title="Save Position" onSubmit={handleSubmit} disabled={hasErrors} />
          <Action title="Cancel" onAction={pop} />
        </ActionPanel>
      }
    >
      <Form.Description
        title="Edit Position"
        text={`${quote.symbol} — ${quote.shortName ?? ""}\nCurrent Price: ${formatCurrency(currentPrice, currency)}`}
      />

      <Form.TextField
        id="units"
        title="Units"
        placeholder="50"
        info="Number of shares/units owned"
        value={unitsValue}
        onChange={setUnitsValue}
        error={unitsError}
      />

      <Form.TextField
        id="costBasis"
        title="Cost Basis"
        placeholder="7500.00"
        info="Total amount paid (for P&L calculation)"
        value={costBasisValue}
        onChange={setCostBasisValue}
        error={costBasisError}
      />

      {currentValue != null && (
        <>
          <Form.Separator />
          <Form.Description title="Calculated Values" text="" />
          <Form.Description title="Current Value" text={formatCurrency(currentValue, currency)} />
          {costPerShare != null && (
            <Form.Description title="Cost per Share" text={formatCurrency(costPerShare, currency)} />
          )}
          {unrealizedPL != null && unrealizedPLPercent != null && (
            <Form.Description
              title="Unrealized P&L"
              text={`${unrealizedPL >= 0 ? "+" : ""}${formatCurrency(unrealizedPL, currency)} (${unrealizedPL >= 0 ? "+" : ""}${formatNumber(unrealizedPLPercent)}%)`}
            />
          )}
        </>
      )}
    </Form>
  );
}
