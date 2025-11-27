/**
 * LocalStorage operations for stock lists and user settings
 */

import { LocalStorage } from "@raycast/api";
import type { StockList, UserSettings } from "../types";

const LISTS_KEY = "stockLists";
const SETTINGS_KEY = "userSettings";

/**
 * Load all stock lists from LocalStorage
 * @returns Array of stock lists, empty array if none exist or on parse error
 */
export async function loadLists(): Promise<StockList[]> {
  const raw = await LocalStorage.getItem<string>(LISTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StockList[];
  } catch (error) {
    console.error("Failed to parse stock lists from LocalStorage:", error);
    return [];
  }
}

/**
 * Save stock lists to LocalStorage
 * @param lists Array of stock lists to save
 */
export async function saveLists(lists: StockList[]): Promise<void> {
  await LocalStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

/**
 * Load user settings from LocalStorage
 * @returns User settings, defaults if none exist or on parse error
 */
export async function loadSettings(): Promise<UserSettings> {
  const raw = await LocalStorage.getItem<string>(SETTINGS_KEY);
  if (!raw) return { defaultListId: null };
  try {
    return JSON.parse(raw) as UserSettings;
  } catch (error) {
    console.error("Failed to parse user settings from LocalStorage:", error);
    return { defaultListId: null };
  }
}

/**
 * Save user settings to LocalStorage
 * @param settings User settings to save
 */
export async function saveSettings(settings: UserSettings): Promise<void> {
  await LocalStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

/**
 * Check if lists exist in LocalStorage (used for migration detection)
 * @returns True if lists key exists, false otherwise
 */
export async function listsExist(): Promise<boolean> {
  const raw = await LocalStorage.getItem<string>(LISTS_KEY);
  return raw !== undefined;
}
