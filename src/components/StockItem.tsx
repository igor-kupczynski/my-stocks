import { ActionPanel, Action, Icon, List, Color } from "@raycast/api";
import type { Quote } from "../data/quotes";
import type { ListItem } from "../types";
import { EditPositionForm } from "./EditPositionForm";

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

function formatPercentChange(percent?: number): string {
  if (percent == null) return "";
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(2)}%`;
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

interface StockItemProps {
  listItem: ListItem;
  quote: Quote;
  isPortfolio: boolean;
  showDetail: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  availableLists: Array<{ id: string; name: string; icon: string }>;
  currentListId: string;
  onToggleDetail: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onMoveToList: (targetListId: string) => void;
  onRemove: () => void;
  onEditPosition: (units: number | undefined, costBasis: number | undefined) => void;
}

export function StockItem({
  listItem,
  quote,
  isPortfolio,
  showDetail,
  canMoveUp,
  canMoveDown,
  availableLists,
  currentListId,
  onToggleDetail,
  onMoveUp,
  onMoveDown,
  onMoveToList,
  onRemove,
  onEditPosition,
}: StockItemProps) {
  const currency = quote.currency ?? "USD";
  const price = quote.regularMarketPrice;
  const change = quote.regularMarketChange;
  const changePercent = quote.regularMarketChangePercent;
  const { icon, tintColor } = getPerformanceIndicator(change);

  // Portfolio-specific calculations
  const positionValue = isPortfolio && listItem.units && price != null ? listItem.units * price : undefined;
  const dayPL = isPortfolio && listItem.units && change != null && price != null ? listItem.units * change : undefined;
  const unrealizedPL =
    isPortfolio && listItem.units && listItem.costBasis != null && positionValue != null
      ? positionValue - listItem.costBasis
      : undefined;
  const unrealizedPLPercent =
    unrealizedPL != null && listItem.costBasis != null && listItem.costBasis !== 0
      ? (unrealizedPL / listItem.costBasis) * 100
      : undefined;

  // Build accessories based on mode
  const buildAccessories = (): List.Item.Accessory[] => {
    const baseAccessories: List.Item.Accessory[] = [
      { text: price != null ? `$${formatNumber(price)}` : "—" },
      { tag: { value: formatPercentChange(changePercent), color: tintColor } },
    ];

    if (!isPortfolio) {
      return baseAccessories;
    }

    if (listItem.units == null) {
      return [...baseAccessories, { text: "— shares" }];
    }

    return [
      ...baseAccessories,
      {
        text: `${listItem.units} shares · ${formatCurrency(positionValue, currency)}`,
      },
      {
        text: `Day: ${formatCurrency(dayPL, currency)}`,
        tag: dayPL != null ? { color: dayPL >= 0 ? Color.Green : Color.Red } : undefined,
      },
    ];
  };

  // Subtitle for portfolio mode
  const subtitle = quote.shortName ?? "";

  const detailMarkdown = isPortfolio
    ? `# ${quote.symbol} — ${quote.shortName ?? ""}

## Position
- **Shares:** ${listItem.units ?? 0}
- **Current Price:** ${formatCurrency(price, currency)}
- **Position Value:** ${formatCurrency(positionValue, currency)}
- **Day P&L:** ${formatCurrency(dayPL, currency)} (${formatPercentChange(changePercent)})
${listItem.costBasis != null ? `- **Cost Basis:** ${formatCurrency(listItem.costBasis, currency)}` : ""}
${unrealizedPL != null && unrealizedPLPercent != null ? `- **Unrealized P&L:** ${unrealizedPL >= 0 ? "+" : ""}${formatCurrency(Math.abs(unrealizedPL), currency)} (${unrealizedPL >= 0 ? "+" : ""}${unrealizedPLPercent.toFixed(2)}%)` : ""}

## Market Data
- **As of:** ${formatMarketTime(quote.regularMarketTime)}
- **Open:** ${formatCurrency(quote.regularMarketOpen, currency)}
- **High:** ${formatCurrency(quote.regularMarketDayHigh, currency)}
- **Low:** ${formatCurrency(quote.regularMarketDayLow, currency)}
- **Close:** ${formatCurrency(quote.regularMarketPreviousClose, currency)}
- **52W High:** ${formatCurrency(quote.fiftyTwoWeekHigh, currency)}
- **52W Low:** ${formatCurrency(quote.fiftyTwoWeekLow, currency)}
- **Volume:** ${formatLargeNumber(quote.regularMarketVolume)}
- **Market Cap:** ${formatLargeNumber(quote.marketCap)}
`
    : undefined;

  return (
    <List.Item
      icon={{ source: icon, tintColor }}
      title={quote.symbol}
      subtitle={subtitle}
      accessories={buildAccessories()}
      detail={
        showDetail ? (
          detailMarkdown ? (
            <List.Item.Detail markdown={detailMarkdown} />
          ) : (
            <List.Item.Detail
              metadata={
                <List.Item.Detail.Metadata>
                  <List.Item.Detail.Metadata.Label title="As of" text={formatMarketTime(quote.regularMarketTime)} />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label
                    title="Open"
                    text={formatCurrency(quote.regularMarketOpen, currency)}
                  />
                  <List.Item.Detail.Metadata.Label
                    title="High"
                    text={formatCurrency(quote.regularMarketDayHigh, currency)}
                  />
                  <List.Item.Detail.Metadata.Label
                    title="Low"
                    text={formatCurrency(quote.regularMarketDayLow, currency)}
                  />
                  <List.Item.Detail.Metadata.Label
                    title="Close"
                    text={formatCurrency(quote.regularMarketPreviousClose, currency)}
                  />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label
                    title="52W High"
                    text={formatCurrency(quote.fiftyTwoWeekHigh, currency)}
                  />
                  <List.Item.Detail.Metadata.Label
                    title="52W Low"
                    text={formatCurrency(quote.fiftyTwoWeekLow, currency)}
                  />
                  <List.Item.Detail.Metadata.Separator />
                  <List.Item.Detail.Metadata.Label title="Volume" text={formatLargeNumber(quote.regularMarketVolume)} />
                  <List.Item.Detail.Metadata.Label title="Mkt Cap" text={formatLargeNumber(quote.marketCap)} />
                </List.Item.Detail.Metadata>
              }
            />
          )
        ) : undefined
      }
      actions={
        <ActionPanel>
          <Action.OpenInBrowser
            title="Open in Yahoo Finance"
            url={`https://finance.yahoo.com/quote/${encodeURIComponent(quote.symbol)}`}
          />
          <Action
            title={showDetail ? "Hide Details" : "Show Details"}
            icon={Icon.Sidebar}
            onAction={onToggleDetail}
            shortcut={{ modifiers: ["cmd"], key: "d" }}
          />
          {isPortfolio && (
            <Action.Push
              title="Edit Position"
              icon={Icon.Pencil}
              shortcut={{ modifiers: ["cmd"], key: "e" }}
              target={<EditPositionForm listItem={listItem} quote={quote} onSave={onEditPosition} />}
            />
          )}
          {canMoveUp && (
            <Action
              title="Move up"
              icon={Icon.ArrowUp}
              onAction={onMoveUp}
              shortcut={{ modifiers: ["cmd"], key: "arrowUp" }}
            />
          )}
          {canMoveDown && (
            <Action
              title="Move Down"
              icon={Icon.ArrowDown}
              onAction={onMoveDown}
              shortcut={{ modifiers: ["cmd"], key: "arrowDown" }}
            />
          )}
          <ActionPanel.Submenu title="Move to List…" icon={Icon.List} shortcut={{ modifiers: ["cmd"], key: "l" }}>
            {availableLists
              .filter((list) => list.id !== currentListId)
              .map((list) => (
                <Action key={list.id} title={`${list.icon} ${list.name}`} onAction={() => onMoveToList(list.id)} />
              ))}
          </ActionPanel.Submenu>
          <Action
            title="Remove from List"
            icon={Icon.Trash}
            style={Action.Style.Destructive}
            onAction={onRemove}
            shortcut={{ modifiers: ["cmd"], key: "backspace" }}
          />
          <Action.CopyToClipboard title="Copy Symbol" content={quote.symbol} />
          <Action.CopyToClipboard
            title="Copy Price"
            content={price != null ? price.toFixed(2) : ""}
            shortcut={{ modifiers: ["cmd", "shift"], key: "c" }}
          />
        </ActionPanel>
      }
    />
  );
}
