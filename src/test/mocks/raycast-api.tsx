import { vi } from "vitest";
import { ReactNode } from "react";

export const getPreferenceValues = vi.fn(() => ({}));
export const open = vi.fn();

interface TextAccessory {
  value: string;
  color?: string;
}

interface Accessory {
  text?: string | TextAccessory;
  tag?: { value: string; color: string };
}

interface IconObject {
  source: string;
  tintColor?: string;
}

interface ListProps {
  searchBarPlaceholder?: string;
  isLoading?: boolean;
  isShowingDetail?: boolean;
  children?: ReactNode;
}

interface DetailMetadataProps {
  children?: ReactNode;
}

interface DetailMetadataLabelProps {
  title: string;
  text?: string;
}

interface DetailProps {
  markdown?: string;
  metadata?: ReactNode;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string | IconObject;
  accessories?: Accessory[];
  actions?: ReactNode;
  detail?: ReactNode;
  children?: ReactNode;
}

interface ListEmptyViewProps {
  icon?: string | IconObject;
  title: string;
  description?: string;
}

interface ActionPanelProps {
  children?: ReactNode;
}

interface ActionProps {
  title: string;
  url?: string;
  content?: string;
  shortcut?: { modifiers: string[]; key: string };
  onAction?: () => void;
}

function getIconValue(icon: string | IconObject | undefined): string {
  if (!icon) return "";
  if (typeof icon === "string") return icon;
  return JSON.stringify(icon);
}

export function List(props: ListProps) {
  return (
    <div role="list" aria-label={props.searchBarPlaceholder} data-loading={props.isLoading}>
      {props.children}
    </div>
  );
}

function ListItemDetail(props: DetailProps) {
  return (
    <div data-testid="list-item-detail">
      {props.markdown && <div data-testid="detail-markdown">{props.markdown}</div>}
      {props.metadata}
    </div>
  );
}

function DetailMetadata(props: DetailMetadataProps) {
  return <div data-testid="detail-metadata">{props.children}</div>;
}

function DetailMetadataLabel(props: DetailMetadataLabelProps) {
  return (
    <div data-testid="metadata-label">
      {props.title}: {props.text}
    </div>
  );
}

function DetailMetadataSeparator() {
  return <hr data-testid="metadata-separator" />;
}

interface TagListItemProps {
  text: string;
  color?: string;
}

interface TagListProps {
  title: string;
  children?: ReactNode;
}

function DetailMetadataTagList(props: TagListProps) {
  return (
    <div data-testid="metadata-taglist">
      {props.title}: {props.children}
    </div>
  );
}

function DetailMetadataTagListItem(props: TagListItemProps) {
  return (
    <span data-testid="metadata-tag" data-color={props.color}>
      [{props.color}]{props.text}
    </span>
  );
}

DetailMetadataTagList.Item = DetailMetadataTagListItem;

ListItemDetail.Metadata = DetailMetadata;
ListItemDetail.Metadata.Label = DetailMetadataLabel;
ListItemDetail.Metadata.Separator = DetailMetadataSeparator;
ListItemDetail.Metadata.TagList = DetailMetadataTagList;

List.Item = (props: ListItemProps) => {
  const accessoryText = props.accessories
    ?.map((a) => {
      if (a.text) {
        if (typeof a.text === "string") return a.text;
        // Text object with value and optional color
        const color = a.text.color ?? "";
        return color ? `[${color}]${a.text.value}` : a.text.value;
      }
      if (a.tag) return `[${a.tag.color}]${a.tag.value}`;
      return "";
    })
    .join(" ");

  return (
    <div role="listitem" title={props.title} data-icon={getIconValue(props.icon)}>
      {props.title} {props.subtitle} {accessoryText}
      {props.detail}
      {props.actions}
    </div>
  );
};

List.Item.Detail = ListItemDetail;

List.EmptyView = (props: ListEmptyViewProps) => (
  <div role="status" data-icon={getIconValue(props.icon)}>
    {props.title} {props.description}
  </div>
);

export function ActionPanel(props: ActionPanelProps) {
  return <div role="group">{props.children}</div>;
}

export function Action(props: ActionProps) {
  return <button onClick={props.onAction}>{props.title}</button>;
}
Action.OpenInBrowser = (props: ActionProps) => (
  <a href={props.url} data-testid="open-in-browser">
    {props.title}
  </a>
);
Action.CopyToClipboard = (props: ActionProps) => (
  <button data-testid="copy-to-clipboard" data-content={props.content}>
    {props.title}
  </button>
);

export const Icon = {
  LineChart: "icon-line-chart",
  ExclamationMark: "icon-error",
  AppWindow: "icon-app",
  ArrowUpCircleFilled: "icon-arrow-up-circle-filled",
  ArrowDownCircleFilled: "icon-arrow-down-circle-filled",
  MinusCircle: "icon-minus-circle",
  Minus: "icon-minus",
  BarChart: "icon-bar-chart",
};

export const Color = {
  Green: "green",
  Red: "red",
  PrimaryText: "primary-text",
  SecondaryText: "secondary-text",
};
