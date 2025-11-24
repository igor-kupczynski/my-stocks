import { vi } from "vitest";
import { ReactNode } from "react";

export const getPreferenceValues = vi.fn(() => ({}));
export const open = vi.fn();

interface ListProps {
  searchBarPlaceholder?: string;
  children?: ReactNode;
}

interface ListItemProps {
  title: string;
  subtitle?: string;
  children?: ReactNode;
}

interface ListEmptyViewProps {
  title: string;
}

interface ActionPanelProps {
  children?: ReactNode;
}

interface ActionProps {
  title: string;
  onAction?: () => void;
}

export function List(props: ListProps) {
  return (
    <div role="list" aria-label={props.searchBarPlaceholder}>
      {props.children}
    </div>
  );
}

List.Item = (props: ListItemProps) => (
  <div role="listitem" title={props.title}>
    {props.title} {props.subtitle}
  </div>
);
List.EmptyView = (props: ListEmptyViewProps) => <div role="status">{props.title}</div>;

export function ActionPanel(props: ActionPanelProps) {
  return <div>{props.children}</div>;
}

export function Action(props: ActionProps) {
  return <button onClick={props.onAction}>{props.title}</button>;
}
Action.OpenInBrowser = () => null;
Action.CopyToClipboard = () => null;

export const Icon = { ChartLine: "icon-chart", ExclamationMark: "icon-error", AppWindow: "icon-app" };
export const Color = { Green: "green", Red: "red" };
