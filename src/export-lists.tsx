/**
 * Export Lists command - exports all portfolio data to clipboard
 */

import { Clipboard, showToast, Toast } from "@raycast/api";
import { loadLists, loadSettings } from "./data/lists";
import { exportToJSON } from "./data/export";

export default async function Command() {
  try {
    // Load data from LocalStorage
    const lists = await loadLists();
    const settings = await loadSettings();

    // Serialize to JSON
    const json = exportToJSON(lists, settings);

    // Copy to clipboard
    await Clipboard.copy(json);

    // Show success message
    await showToast({
      style: Toast.Style.Success,
      title: "Portfolio data copied to clipboard",
      message: `Exported ${lists.length} list${lists.length !== 1 ? "s" : ""}`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Export failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
