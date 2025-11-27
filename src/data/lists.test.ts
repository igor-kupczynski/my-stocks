import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorage } from "@raycast/api";
import { loadLists, saveLists, loadSettings, saveSettings, listsExist } from "./lists";
import type { StockList, UserSettings } from "../types";

describe("lists", () => {
  beforeEach(async () => {
    // Clear storage before each test
    await LocalStorage.clear();
    vi.clearAllMocks();
  });

  describe("loadLists", () => {
    it("returns empty array when no lists exist", async () => {
      const result = await loadLists();
      expect(result).toEqual([]);
    });

    it("returns parsed lists from LocalStorage", async () => {
      const mockLists: StockList[] = [
        {
          id: "test-id",
          name: "Test List",
          icon: "📋",
          symbols: [{ symbol: "AAPL" }],
          isPortfolio: false,
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];
      await LocalStorage.setItem("stockLists", JSON.stringify(mockLists));

      const result = await loadLists();
      expect(result).toEqual(mockLists);
    });

    it("returns empty array on JSON parse error", async () => {
      await LocalStorage.setItem("stockLists", "invalid json");

      const result = await loadLists();
      expect(result).toEqual([]);
    });
  });

  describe("saveLists", () => {
    it("saves lists to LocalStorage", async () => {
      const mockLists: StockList[] = [
        {
          id: "test-id",
          name: "Test List",
          icon: "📋",
          symbols: [{ symbol: "AAPL" }],
          isPortfolio: false,
          createdAt: 1234567890,
          updatedAt: 1234567890,
        },
      ];

      await saveLists(mockLists);

      const stored = await LocalStorage.getItem<string>("stockLists");
      expect(stored).toBe(JSON.stringify(mockLists));
    });
  });

  describe("loadSettings", () => {
    it("returns default settings when none exist", async () => {
      const result = await loadSettings();
      expect(result).toEqual({ defaultListId: null });
    });

    it("returns parsed settings from LocalStorage", async () => {
      const mockSettings: UserSettings = {
        defaultListId: "list-123",
      };
      await LocalStorage.setItem("userSettings", JSON.stringify(mockSettings));

      const result = await loadSettings();
      expect(result).toEqual(mockSettings);
    });

    it("returns default settings on JSON parse error", async () => {
      await LocalStorage.setItem("userSettings", "invalid json");

      const result = await loadSettings();
      expect(result).toEqual({ defaultListId: null });
    });
  });

  describe("saveSettings", () => {
    it("saves settings to LocalStorage", async () => {
      const mockSettings: UserSettings = {
        defaultListId: "list-123",
      };

      await saveSettings(mockSettings);

      const stored = await LocalStorage.getItem<string>("userSettings");
      expect(stored).toBe(JSON.stringify(mockSettings));
    });
  });

  describe("listsExist", () => {
    it("returns false when lists key does not exist", async () => {
      const result = await listsExist();
      expect(result).toBe(false);
    });

    it("returns true when lists key exists", async () => {
      await LocalStorage.setItem("stockLists", "[]");

      const result = await listsExist();
      expect(result).toBe(true);
    });
  });
});
