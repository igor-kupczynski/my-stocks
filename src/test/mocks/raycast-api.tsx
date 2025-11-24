import { vi } from "vitest";

export const getPreferenceValues = vi.fn(() => ({}));
export const open = vi.fn();

export function List(props: any) {
  return <div role="list" aria-label={props.searchBarPlaceholder}>{props.children}</div>;
}

List.Item = (props: any) => <div role="listitem" title={props.title}>{props.title} {props.subtitle}</div>;
List.EmptyView = (props: any) => <div role="status">{props.title}</div>;

export function ActionPanel(props: any) { return <div>{props.children}</div>; }

export function Action(props: any) { return <button onClick={props.onAction}>{props.title}</button>; }
Action.OpenInBrowser = () => null;
Action.CopyToClipboard = () => null;

export const Icon = { ChartLine: "icon-chart", ExclamationMark: "icon-error", AppWindow: "icon-app" };
export const Color = { Green: "green", Red: "red" };
