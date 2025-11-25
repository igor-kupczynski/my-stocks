import { vi } from "vitest";
import { ReactNode } from "react";

export const getPreferenceValues = vi.fn(() => ({}));
export const open = vi.fn();

interface Accessory {
  text?: string;
  tag?: { value: string; color: string };
}

interface ListProps {
  searchBarPlaceholder?: string;
  isLoading?: boolean;
  children?: ReactNode;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  icon?: string;
  accessories?: Accessory[];
  actions?: ReactNode;
  children?: ReactNode;
}

interface ListEmptyViewProps {
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
  onAction?: () => void;
}

export function List(props: ListProps) {
  return (
    <div role="list" aria-label={props.searchBarPlaceholder} data-loading={props.isLoading}>
      {props.children}
    </div>
  );
}

List.Item = (props: ListItemProps) => {
  const accessoryText = props.accessories
    ?.map((a) => {
      if (a.text) return a.text;
      if (a.tag) return `[${a.tag.color}]${a.tag.value}`;
      return "";
    })
    .join(" ");

  return (
    <div role="listitem" title={props.title} data-icon={props.icon}>
      {props.title} {props.subtitle} {accessoryText}
      {props.actions}
    </div>
  );
};

List.EmptyView = (props: ListEmptyViewProps) => (
  <div role="status">
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

export const Icon = { LineChart: "icon-line-chart", ExclamationMark: "icon-error", AppWindow: "icon-app" };
export const Color = { Green: "green", Red: "red" };
