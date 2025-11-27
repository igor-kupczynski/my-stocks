/**
 * Core data types for My Stocks v2.0
 */

/**
 * A list item representing a stock symbol with optional portfolio data
 */
export interface ListItem {
  /** Stock symbol (e.g., "AAPL") */
  symbol: string;
  /** Optional: number of shares/units owned */
  units?: number;
  /** Optional: total cost paid (for P&L calculation) */
  costBasis?: number;
}

/**
 * A named collection of stock symbols with optional portfolio tracking
 */
export interface StockList {
  /** Unique identifier (UUID) */
  id: string;
  /** Display name (e.g., "Tech", "Retirement Portfolio") */
  name: string;
  /** Emoji icon (e.g., "💼", "📈", "🪙") */
  icon: string;
  /** Ordered array of list items */
  symbols: ListItem[];
  /** Show portfolio value columns when true */
  isPortfolio: boolean;
  /** Creation timestamp (milliseconds since epoch) */
  createdAt: number;
  /** Last update timestamp (milliseconds since epoch) */
  updatedAt: number;
}

/**
 * User settings stored in LocalStorage
 */
export interface UserSettings {
  /** ID of the default list for quick-add actions */
  defaultListId: string | null;
}
