/**
 * Export/import functionality for portfolio data
 */

import type { StockList, UserSettings } from "../types";

/**
 * Export data format (v2.0)
 */
export interface ExportData {
  /** Format version for forward compatibility */
  version: 2;
  /** ISO timestamp of export */
  exportedAt: string;
  /** All stock lists */
  lists: StockList[];
  /** User settings */
  settings: UserSettings;
}

/**
 * Validation error for import data
 */
export class ImportValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportValidationError";
  }
}

/**
 * Serialize all lists and settings to JSON
 * @param lists Array of stock lists
 * @param settings User settings
 * @returns Pretty-printed JSON string
 */
export function exportToJSON(lists: StockList[], settings: UserSettings): string {
  const data: ExportData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    lists,
    settings,
  };
  return JSON.stringify(data, null, 2);
}

/**
 * Validate and parse imported JSON data
 * @param jsonString JSON string to parse
 * @returns Parsed and validated export data
 * @throws ImportValidationError if validation fails
 */
export function validateImportData(jsonString: string): ExportData {
  // Parse JSON
  let data: unknown;
  try {
    data = JSON.parse(jsonString);
  } catch {
    throw new ImportValidationError("Invalid JSON format");
  }

  // Validate structure
  if (!data || typeof data !== "object") {
    throw new ImportValidationError("Invalid data structure");
  }

  const obj = data as Record<string, unknown>;

  // Validate version
  if (obj.version !== 2) {
    throw new ImportValidationError(`Unsupported version: ${obj.version}. Expected version 2.`);
  }

  // Validate exportedAt
  if (typeof obj.exportedAt !== "string") {
    throw new ImportValidationError("Missing or invalid exportedAt timestamp");
  }

  // Validate lists
  if (!Array.isArray(obj.lists)) {
    throw new ImportValidationError("Missing or invalid lists array");
  }

  for (const [index, list] of obj.lists.entries()) {
    if (!list || typeof list !== "object") {
      throw new ImportValidationError(`Invalid list at index ${index}`);
    }

    const listObj = list as Record<string, unknown>;

    if (typeof listObj.id !== "string" || !listObj.id) {
      throw new ImportValidationError(`Invalid or missing id in list at index ${index}`);
    }
    if (typeof listObj.name !== "string" || !listObj.name) {
      throw new ImportValidationError(`Invalid or missing name in list at index ${index}`);
    }
    if (typeof listObj.icon !== "string") {
      throw new ImportValidationError(`Invalid or missing icon in list at index ${index}`);
    }
    if (!Array.isArray(listObj.symbols)) {
      throw new ImportValidationError(`Invalid or missing symbols array in list at index ${index}`);
    }
    if (typeof listObj.isPortfolio !== "boolean") {
      throw new ImportValidationError(`Invalid or missing isPortfolio in list at index ${index}`);
    }
    if (typeof listObj.createdAt !== "number") {
      throw new ImportValidationError(`Invalid or missing createdAt in list at index ${index}`);
    }
    if (typeof listObj.updatedAt !== "number") {
      throw new ImportValidationError(`Invalid or missing updatedAt in list at index ${index}`);
    }

    // Validate symbols
    for (const [symbolIndex, item] of listObj.symbols.entries()) {
      if (!item || typeof item !== "object") {
        throw new ImportValidationError(`Invalid symbol at index ${symbolIndex} in list "${listObj.name}"`);
      }

      const itemObj = item as Record<string, unknown>;

      if (typeof itemObj.symbol !== "string" || !itemObj.symbol) {
        throw new ImportValidationError(`Invalid or missing symbol at index ${symbolIndex} in list "${listObj.name}"`);
      }
      if (itemObj.units !== undefined && typeof itemObj.units !== "number") {
        throw new ImportValidationError(`Invalid units at symbol "${itemObj.symbol}" in list "${listObj.name}"`);
      }
      if (itemObj.costBasis !== undefined && typeof itemObj.costBasis !== "number") {
        throw new ImportValidationError(`Invalid costBasis at symbol "${itemObj.symbol}" in list "${listObj.name}"`);
      }
    }
  }

  // Validate settings
  if (!obj.settings || typeof obj.settings !== "object") {
    throw new ImportValidationError("Missing or invalid settings object");
  }

  const settings = obj.settings as Record<string, unknown>;

  if (settings.defaultListId !== null && typeof settings.defaultListId !== "string") {
    throw new ImportValidationError("Invalid defaultListId in settings");
  }

  return data as ExportData;
}
