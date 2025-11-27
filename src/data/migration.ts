/**
 * Migration logic from v1 to v2
 * Handles one-time migration of stockSymbols preference to LocalStorage-based lists
 */

import { getPreferenceValues, showToast, Toast } from "@raycast/api";
import { randomUUID } from "crypto";
import type { StockList, ListItem } from "../types";
import { parseSymbols } from "../utils/symbols";
import { saveLists, listsExist } from "./lists";

interface V1Preferences {
  stockSymbols?: string;
}

/**
 * Migrate v1 preference data to v2 LocalStorage format
 * - Runs only once on first v2 launch (when lists don't exist)
 * - Creates default "Watchlist" with migrated symbols
 * - Shows toast notification with migration count
 * - Preserves v1 preference for rollback safety
 */
export async function migrateFromV1IfNeeded(): Promise<void> {
  // Check if migration has already been performed
  const hasExistingLists = await listsExist();
  if (hasExistingLists) {
    return; // Already migrated or user has created lists
  }

  // Read v1 preference
  const preferences = getPreferenceValues<V1Preferences>();
  const v1Symbols = parseSymbols(preferences.stockSymbols);

  // If no v1 data, nothing to migrate
  if (v1Symbols.length === 0) {
    return;
  }

  // Create default "Watchlist" list with migrated symbols
  const now = Date.now();
  const defaultList: StockList = {
    id: randomUUID(),
    name: "Watchlist",
    icon: "📋",
    symbols: v1Symbols.map(
      (symbol): ListItem => ({
        symbol,
      }),
    ),
    isPortfolio: false,
    createdAt: now,
    updatedAt: now,
  };

  // Save to LocalStorage
  await saveLists([defaultList]);

  // Show success notification
  await showToast({
    style: Toast.Style.Success,
    title: "Migrated to v2",
    message: `Migrated ${v1Symbols.length} stock${v1Symbols.length === 1 ? "" : "s"} to your Watchlist`,
  });
}

/**
 * Check if migration is needed (for testing purposes)
 * @returns True if migration should run
 */
export async function needsMigration(): Promise<boolean> {
  const hasExistingLists = await listsExist();
  if (hasExistingLists) {
    return false;
  }

  const preferences = getPreferenceValues<V1Preferences>();
  const v1Symbols = parseSymbols(preferences.stockSymbols);
  return v1Symbols.length > 0;
}
