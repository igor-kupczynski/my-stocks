/**
 * Import Lists command - imports portfolio data from clipboard
 */

import { Clipboard, confirmAlert, Alert, showToast, Toast } from "@raycast/api";
import { saveLists, saveSettings } from "./data/lists";
import { validateImportData, ImportValidationError } from "./data/export";

export default async function Command() {
  try {
    // Read from clipboard
    const clipboardText = await Clipboard.readText();

    if (!clipboardText) {
      await showToast({
        style: Toast.Style.Failure,
        title: "Import failed",
        message: "Clipboard is empty",
      });
      return;
    }

    // Validate and parse
    let data;
    try {
      data = validateImportData(clipboardText);
    } catch (error) {
      if (error instanceof ImportValidationError) {
        await showToast({
          style: Toast.Style.Failure,
          title: "Invalid import data",
          message: error.message,
        });
      } else {
        throw error;
      }
      return;
    }

    // Show confirmation
    const listCount = data.lists.length;
    const totalStocks = data.lists.reduce((sum, list) => sum + list.symbols.length, 0);

    const confirmed = await confirmAlert({
      title: `Import ${listCount} list${listCount !== 1 ? "s" : ""}?`,
      message: `This will replace your current data with ${listCount} list${listCount !== 1 ? "s" : ""} containing ${totalStocks} stock${totalStocks !== 1 ? "s" : ""} total. This action cannot be undone.`,
      primaryAction: {
        title: "Import",
        style: Alert.ActionStyle.Destructive,
      },
      dismissAction: {
        title: "Cancel",
      },
    });

    if (!confirmed) {
      return;
    }

    // Import data
    await saveLists(data.lists);
    await saveSettings(data.settings);

    // Show success message
    await showToast({
      style: Toast.Style.Success,
      title: "Import successful",
      message: `Imported ${listCount} list${listCount !== 1 ? "s" : ""} with ${totalStocks} stock${totalStocks !== 1 ? "s" : ""}`,
    });
  } catch (error) {
    await showToast({
      style: Toast.Style.Failure,
      title: "Import failed",
      message: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
