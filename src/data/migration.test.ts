import { describe, it, expect, beforeEach, vi } from "vitest";
import { LocalStorage, getPreferenceValues, showToast } from "@raycast/api";
import { migrateFromV1IfNeeded, needsMigration } from "./migration";
import { loadLists } from "./lists";

// Mock crypto.randomUUID
vi.mock("crypto", () => ({
  randomUUID: vi.fn(() => "test-uuid-123"),
}));

describe("migration", () => {
  beforeEach(async () => {
    // Clear storage and mocks before each test
    await LocalStorage.clear();
    vi.clearAllMocks();
  });

  describe("migrateFromV1IfNeeded", () => {
    it("does nothing when lists already exist", async () => {
      // Setup: lists already exist in LocalStorage
      await LocalStorage.setItem("stockLists", "[]");
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL, GOOGL" });

      await migrateFromV1IfNeeded();

      // Should not create new lists or show toast
      const lists = await loadLists();
      expect(lists).toEqual([]);
      expect(showToast).not.toHaveBeenCalled();
    });

    it("does nothing when no v1 symbols exist", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "" });

      await migrateFromV1IfNeeded();

      const lists = await loadLists();
      expect(lists).toEqual([]);
      expect(showToast).not.toHaveBeenCalled();
    });

    it("migrates single symbol from v1", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL" });

      await migrateFromV1IfNeeded();

      const lists = await loadLists();
      expect(lists).toHaveLength(1);
      expect(lists[0]).toMatchObject({
        id: "test-uuid-123",
        name: "Watchlist",
        icon: "📋",
        symbols: [{ symbol: "AAPL" }],
        isPortfolio: false,
      });
      expect(lists[0].createdAt).toBeGreaterThan(0);
      expect(lists[0].updatedAt).toBeGreaterThan(0);

      expect(showToast).toHaveBeenCalledWith({
        style: "success",
        title: "Migrated to v2",
        message: "Migrated 1 stock to your Watchlist",
      });
    });

    it("migrates multiple symbols from v1", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL, GOOGL, MSFT" });

      await migrateFromV1IfNeeded();

      const lists = await loadLists();
      expect(lists).toHaveLength(1);
      expect(lists[0]).toMatchObject({
        name: "Watchlist",
        icon: "📋",
        symbols: [{ symbol: "AAPL" }, { symbol: "GOOGL" }, { symbol: "MSFT" }],
        isPortfolio: false,
      });

      expect(showToast).toHaveBeenCalledWith({
        style: "success",
        title: "Migrated to v2",
        message: "Migrated 3 stocks to your Watchlist",
      });
    });

    it("handles symbols with whitespace and invalid entries", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({
        stockSymbols: "  AAPL  ,  , GOOGL, invalid!, MSFT  ",
      });

      await migrateFromV1IfNeeded();

      const lists = await loadLists();
      expect(lists).toHaveLength(1);
      expect(lists[0].symbols).toEqual([{ symbol: "AAPL" }, { symbol: "GOOGL" }, { symbol: "MSFT" }]);
    });

    it("deduplicates symbols during migration", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL, aapl, AAPL" });

      await migrateFromV1IfNeeded();

      const lists = await loadLists();
      expect(lists[0].symbols).toEqual([{ symbol: "AAPL" }]);

      expect(showToast).toHaveBeenCalledWith({
        style: "success",
        title: "Migrated to v2",
        message: "Migrated 1 stock to your Watchlist",
      });
    });
  });

  describe("needsMigration", () => {
    it("returns false when lists already exist", async () => {
      await LocalStorage.setItem("stockLists", "[]");
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL" });

      const result = await needsMigration();
      expect(result).toBe(false);
    });

    it("returns false when no v1 symbols exist", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "" });

      const result = await needsMigration();
      expect(result).toBe(false);
    });

    it("returns true when v1 symbols exist and no lists", async () => {
      vi.mocked(getPreferenceValues).mockReturnValue({ stockSymbols: "AAPL, GOOGL" });

      const result = await needsMigration();
      expect(result).toBe(true);
    });
  });
});
