import { vi } from "vitest";
import { ReactNode } from "react";

export const getPreferenceValues = vi.fn(() => ({}));
export const open = vi.fn();
export const showToast = vi.fn(async () => ({}));

// LocalStorage mock
const storage = new Map<string, string>();
export const LocalStorage = {
  getItem: vi.fn(async (key: string) => storage.get(key)),
  setItem: vi.fn(async (key: string, value: string) => storage.set(key, value)),
  removeItem: vi.fn(async (key: string) => storage.delete(key)),
  clear: vi.fn(async () => storage.clear()),
  allItems: vi.fn(async () => Object.fromEntries(storage)),
};

// Toast styles
export const Toast = {
  Style: {
    Success: "success",
    Failure: "failure",
    Animated: "animated",
  },
};

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

// Define types first
interface TagListItemProps {
  text: string;
  color?: string;
}

interface TagListProps {
  title: string;
  children?: ReactNode;
}

type DetailMetadataTagListType = ((props: TagListProps) => JSX.Element) & {
  Item: (props: TagListItemProps) => JSX.Element;
};

type DetailMetadataType = ((props: DetailMetadataProps) => JSX.Element) & {
  Label: (props: DetailMetadataLabelProps) => JSX.Element;
  Separator: () => JSX.Element;
  TagList: DetailMetadataTagListType;
};

type ListItemDetailType = ((props: DetailProps) => JSX.Element) & {
  Metadata: DetailMetadataType;
};

type ListItemType = ((props: ListItemProps) => JSX.Element) & {
  Detail: ListItemDetailType;
};

type ListType = ((props: ListProps) => JSX.Element) & {
  Item: ListItemType;
  EmptyView: (props: ListEmptyViewProps) => JSX.Element;
};

// Create ListItemDetail first (needed by List.Item)
const ListItemDetail: ListItemDetailType = Object.assign(
  (props: DetailProps) => {
    return (
      <div data-testid="list-item-detail">
        {props.markdown && <div data-testid="detail-markdown">{props.markdown}</div>}
        {props.metadata}
      </div>
    );
  },
  {
    Metadata: Object.assign(
      (props: DetailMetadataProps) => {
        return <div data-testid="detail-metadata">{props.children}</div>;
      },
      {
        Label: (props: DetailMetadataLabelProps) => {
          return (
            <div data-testid="metadata-label">
              {props.title}: {props.text}
            </div>
          );
        },
        Separator: () => {
          return <hr data-testid="metadata-separator" />;
        },
        TagList: Object.assign(
          (props: TagListProps) => {
            return (
              <div data-testid="metadata-taglist">
                {props.title}: {props.children}
              </div>
            );
          },
          {
            Item: (props: TagListItemProps) => {
              return (
                <span data-testid="metadata-tag" data-color={props.color}>
                  [{props.color}]{props.text}
                </span>
              );
            },
          },
        ) as DetailMetadataTagListType,
      },
    ) as DetailMetadataType,
  },
);

// Create List (uses ListItemDetail)
export const List: ListType = Object.assign(
  (props: ListProps) => {
    return (
      <div role="list" aria-label={props.searchBarPlaceholder} data-loading={props.isLoading}>
        {props.children}
      </div>
    );
  },
  {
    Item: Object.assign(
      (props: ListItemProps) => {
        const accessoryText = props.accessories
          ?.map((a) => {
            if (a.text) {
              if (typeof a.text === "string") return a.text;
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
      },
      {
        Detail: ListItemDetail,
      },
    ) as ListItemType,
    EmptyView: (props: ListEmptyViewProps) => (
      <div role="status" data-icon={getIconValue(props.icon)}>
        {props.title} {props.description}
      </div>
    ),
  },
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
