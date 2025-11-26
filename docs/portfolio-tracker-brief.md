# My Stocks v2: Portfolio Tracker Expansion

## Version Summary

| Version | Focus | Status |
|---------|-------|--------|
| v1.0 | Simple watchlist with preferences-based config | ✅ Complete |
| v2.0 | Multiple lists, portfolio tracking, search-to-add | 🚧 This document |
| v2.1 | File-based cloud sync (BYOF) | 📋 Planned |

## Overview

Expand the existing "My Stocks" Raycast extension from a simple watchlist into a flexible portfolio tracker with multiple lists, optional position tracking, and improved stock management UX.

### Design Philosophy

1. **Progressive complexity**: Basic watchlist usage should remain simple. Portfolio features appear only when the user opts in.
2. **Lists are first-class**: Everything revolves around user-defined lists (watchlists, portfolios, or hybrids).
3. **Quick to add, easy to organize**: Searching and adding stocks should be faster than editing preferences.

### Sync Limitation

Raycast Cloud Sync does **not** sync extension LocalStorage data—only preferences. Since we need dynamic list management (add/remove/reorder), we must use LocalStorage. Export/Import commands provide manual backup and cross-device sync as a workaround. If Raycast adds LocalStorage sync in the future, users will benefit automatically.

---

## Core Concepts

### Lists

A **List** is a named collection of stock symbols with optional portfolio data.

```typescript
interface StockList {
  id: string;              // UUID
  name: string;            // e.g., "Tech", "ETFs", "Retirement Portfolio"
  icon: string;            // Emoji icon, e.g., "💼", "📈", "🪙"
  symbols: ListItem[];     // Ordered array
  isPortfolio: boolean;    // Show portfolio value columns when true
  createdAt: number;
  updatedAt: number;
}

interface ListItem {
  symbol: string;          // e.g., "AAPL"
  units?: number;          // Optional: number of shares/units owned
  costBasis?: number;      // Optional: total cost paid (for P&L calculation)
}
```

**Default behavior:**
- On first launch (no lists exist), create a default list named "Watchlist" with symbols migrated from the v1 `stockSymbols` preference (if any).
- Users can rename, delete, or convert this default list.

### Portfolio Mode

When `isPortfolio: true` for a list:
- Show additional columns: Units, Value, Daily P&L ($)
- Show list total value and daily P&L in section header
- Items without units set display "—" for portfolio columns (graceful degradation)

When `isPortfolio: false`:
- Standard watchlist view (current v1 behavior)
- No portfolio columns shown

**Conversion is seamless**: User can toggle portfolio mode on any list at any time. Adding units to an item in a non-portfolio list doesn't break anything; units are stored but not displayed until portfolio mode is enabled.

---

## Commands

### 1. My Stocks (Main Command)

**Purpose**: Display all lists with their stocks, fetch live prices.

**View Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Filter stocks...                               [List ▾] │
├─────────────────────────────────────────────────────────────┤
│ ▼ Tech Stocks                                               │
├─────────────────────────────────────────────────────────────┤
│ AAPL    Apple Inc.              $189.84   +1.23%  ▲        │
│ MSFT    Microsoft Corporation   $378.91   +0.56%  ▲        │
│ GOOGL   Alphabet Inc.           $141.80   -0.38%  ▼        │
├─────────────────────────────────────────────────────────────┤
│ ▼ Retirement Portfolio                    Total: $45,230.00│
├─────────────────────────────────────────────────────────────┤
│ VTI     Vanguard Total Stock    $245.00   +0.8%   50 units │
│         Value: $12,250          Day: +$98.00               │
│ QQQ     Invesco QQQ Trust       $380.50   +1.2%   30 units │
│         Value: $11,415          Day: +$136.98              │
└─────────────────────────────────────────────────────────────┘
```

**Filtering**:
- Dropdown in search bar to filter by list (default: "All Lists")
- Type to filter symbols/names across visible lists

**Actions on Stock Item**:
| Action | Shortcut | Description |
|--------|----------|-------------|
| Open in Yahoo Finance | `↵` | Primary action (unchanged from v1) |
| Toggle Details | `⌘D` | Show/hide detail panel |
| Edit Position | `⌘E` | Set/update units and cost basis |
| Move to List... | `⌘L` | Move item to a different list |
| Move Up | `⌘↑` | Reorder within list |
| Move Down | `⌘↓` | Reorder within list |
| Remove from List | `⌘⌫` | Remove (with confirmation) |
| Copy Symbol | `⌘C` | Copy ticker to clipboard |
| Copy Price | `⌘⇧C` | Copy current price |

**Actions on Section Header** (list name):
| Action | Shortcut | Description |
|--------|----------|-------------|
| Add Stock to List | `↵` | Opens Add Stock command filtered to this list |
| Edit List | `⌘E` | Rename, toggle portfolio mode |
| Delete List | `⌘⌫` | Delete entire list (with confirmation) |

### 2. Add Stock (New Command)

**Purpose**: Search for stocks and add them to a list.

**Flow**:
1. User types search query (e.g., "apple", "AAPL", "bitcoin")
2. Extension searches Yahoo Finance (use `yahoo-finance2` search/quote)
3. Results displayed with symbol, name, current price, type (Stock/ETF/Crypto/Index)
4. User selects a result → submits to target list

**View Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 apple                                                    │
├─────────────────────────────────────────────────────────────┤
│ AAPL    Apple Inc.                    $189.84    Stock     │
│ APLE    Apple Hospitality REIT        $15.23     Stock     │
│ AAPL.MX Apple Inc. (Mexico)           $3,420.00  Stock     │
└─────────────────────────────────────────────────────────────┘
```

**Actions on Search Result**:
| Action | Shortcut | Description |
|--------|----------|-------------|
| Add to [Default List] | `↵` | Quick add to most recently used list |
| Add to List... | `⌘L` | Show list picker submenu |
| Add with Position... | `⌘E` | Add and immediately set units/cost |
| View in Yahoo Finance | `⌘O` | Open in browser without adding |

**Target List Selection**:
- If user has only one list, skip picker and add directly
- If multiple lists, show a submenu or Form to pick target
- Remember last-used list for `↵` quick-add

### 3. Manage Lists (New Command)

**Purpose**: Create, edit, reorder, and delete lists.

**View Structure**:
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Manage Lists                                             │
├─────────────────────────────────────────────────────────────┤
│ 📋 Tech Stocks              5 items      Watchlist         │
│ 💼 Retirement Portfolio     12 items     Portfolio         │
│ 🪙 Crypto                   3 items      Watchlist         │
├─────────────────────────────────────────────────────────────┤
│ + Create New List                                           │
└─────────────────────────────────────────────────────────────┘
```

**Actions**:
| Action | Shortcut | Description |
|--------|----------|-------------|
| Open List | `↵` | Go to My Stocks filtered to this list |
| Edit List | `⌘E` | Open edit form (name, icon, portfolio toggle) |
| Reorder Up | `⌘↑` | Change list display order |
| Reorder Down | `⌘↓` | Change list display order |
| Delete List | `⌘⌫` | Delete (with confirmation, must have 0 items or force) |
| Duplicate List | `⌘D` | Create copy (useful for "what-if" portfolios) |

**Create/Edit List Form**:
```
┌─────────────────────────────────────────────────────────────┐
│ Create New List                                             │
├─────────────────────────────────────────────────────────────┤
│ Icon:         [📈 ▾]  (emoji picker dropdown)               │
│                                                             │
│ Name:         [Tech Stocks                    ]             │
│                                                             │
│ Type:         ○ Watchlist (prices only)                     │
│               ● Portfolio (track positions)                 │
│                                                             │
│                              [Cancel]  [Create List]        │
└─────────────────────────────────────────────────────────────┘
```

**Icon suggestions** (dropdown options):
- 📋 Watchlist (default for watchlist type)
- 💼 Portfolio (default for portfolio type)
- 📈 Stocks
- 🪙 Crypto
- 💰 ETFs
- 🏦 Banking
- 🌍 International
- ⭐ Favorites
- 🔬 Research

### 4. Export Data (New Command)

**Purpose**: Export all lists and settings to clipboard for backup or transfer to another device.

Since Raycast's LocalStorage doesn't sync via Cloud Sync, this command enables manual backup/restore. The export format is forward-compatible with v2.1's file-based sync.

**Behavior**:
1. Serialize all lists and settings to JSON
2. Copy to clipboard
3. Show toast: "Portfolio data copied to clipboard"

**Output format** (pretty-printed JSON):
```json
{
  "version": 2,
  "exportedAt": "2025-01-15T10:30:00Z",
  "lists": [...],
  "settings": {...}
}
```

**Note**: This format will be extended in v2.1 with `deviceId` and `tombstones` fields for sync. The v2.0 export remains compatible.

### 5. Import Data (New Command)

**Purpose**: Import lists and settings from clipboard (from a previous export).

**Flow**:
1. Read clipboard content
2. Validate JSON structure and version
3. Show confirmation: "Import X lists? This will replace your current data."
4. On confirm: replace LocalStorage data, show toast "Imported X lists"

**Error handling**:
- Invalid JSON → "Clipboard doesn't contain valid export data"
- Wrong version → "Export format not supported. Please re-export from source."
- Empty clipboard → "Clipboard is empty"

### 6. Edit Position (Form, triggered from action)

**Purpose**: Set or update units and cost basis for a stock in a portfolio.

**Form Fields**:
```
┌─────────────────────────────────────────────────────────────┐
│ Edit Position: AAPL                                         │
├─────────────────────────────────────────────────────────────┤
│ Current Price:  $189.84                                     │
│                                                             │
│ Units:          [50                           ]             │
│                 Number of shares/units owned                │
│                                                             │
│ Cost Basis:     [7500.00                      ]  (optional) │
│                 Total amount paid (for P&L)                 │
│                                                             │
│ Calculated:                                                 │
│   Current Value:    $9,492.00                               │
│   Unrealized P&L:   +$1,992.00 (+26.56%)                    │
│                                                             │
│                              [Cancel]  [Save Position]      │
└─────────────────────────────────────────────────────────────┘
```

**Notes**:
- If cost basis is empty/0, don't show unrealized P&L (only daily P&L based on price change)
- Clearing units (setting to 0 or empty) removes position data but keeps symbol in list
- Show calculated cost-per-share as hint: "Cost per share: $150.00" when both fields are filled

### 5. Export/Import Lists (New Commands)

**Purpose**: Manual backup and sync for users without Cloud Sync, or for sharing lists between users.

**Export Lists** command:
1. Serialize all lists to JSON
2. Copy to clipboard
3. Show toast: "Lists exported to clipboard"

**Import Lists** command:
1. Read JSON from clipboard
2. Validate structure
3. Show confirmation: "Import 3 lists? This will merge with existing lists."
4. Merge strategy: Lists with same ID are replaced; new IDs are added
5. Show toast: "Imported 3 lists"

**Actions in Manage Lists**:
| Action | Shortcut | Description |
|--------|----------|-------------|
| Export All Lists | `⌘⇧E` | Copy all lists as JSON to clipboard |
| Import Lists | `⌘⇧I` | Import lists from clipboard JSON |

---

## Data Storage

### Why LocalStorage (with Export/Import for Sync)

**Sync reality check**: Raycast Cloud Sync (Pro) syncs extension **preferences** (defined in `package.json`), but there's no API to write preferences programmatically—they're read-only from code. LocalStorage is writable but does NOT sync.

**Our approach**: Use LocalStorage as the primary store with Export/Import commands for backup and cross-device transfer.

| Storage Type | Syncs? | Writable from Code? | Use Case |
|--------------|--------|---------------------|----------|
| Preferences | ✅ Yes | ❌ No | User-configured settings |
| LocalStorage | ❌ No | ✅ Yes | Dynamic app data |

### LocalStorage Schema

```typescript
// src/data/lists.ts

import { LocalStorage } from "@raycast/api";

const LISTS_KEY = "stockLists";
const SETTINGS_KEY = "userSettings";

interface UserSettings {
  defaultListId: string | null;
}

export async function loadLists(): Promise<StockList[]> {
  const raw = await LocalStorage.getItem<string>(LISTS_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as StockList[];
  } catch {
    return [];
  }
}

export async function saveLists(lists: StockList[]): Promise<void> {
  await LocalStorage.setItem(LISTS_KEY, JSON.stringify(lists));
}

export async function loadSettings(): Promise<UserSettings> {
  const raw = await LocalStorage.getItem<string>(SETTINGS_KEY);
  if (!raw) return { defaultListId: null };
  try {
    return JSON.parse(raw) as UserSettings;
  } catch {
    return { defaultListId: null };
  }
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  await LocalStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
}
```

### Migration from v1

On first launch of v2:
1. Check if `lists` key exists in LocalStorage
2. If not, check v1 preference `stockSymbols` (from `getPreferenceValues()`)
3. If v1 data exists:
   - Create a default list named "Watchlist" with icon "📋"
   - Populate with parsed symbols from preference
   - Save to LocalStorage
   - Show toast: "Migrated X stocks to your Watchlist"
4. The old `stockSymbols` preference can remain (harmless) for rollback safety

---

## API Integration

### Yahoo Finance Endpoints

Using `yahoo-finance2` npm package:

**Quote** (existing):
```typescript
import YahooFinance from "yahoo-finance2";
const yf = new YahooFinance();
const quote = await yf.quote("AAPL");
```

**Search** (new, for Add Stock command):
```typescript
const results = await yf.search("apple");
// Returns: { quotes: [{ symbol, shortname, quoteType, exchange }] }
```

**Batch Quotes** (optimization):
```typescript
// Fetch multiple symbols efficiently
const quotes = await Promise.all(symbols.map(s => yf.quote(s)));
// Consider: yf.quote() accepts array in some versions
```

### Caching Strategy

- Maintain existing 60-second cache for quotes
- Search results: cache for 5 minutes (searches are less time-sensitive)
- LocalStorage list data: no TTL (user data, always fresh from storage)

---

## UI/UX Details

### Portfolio List Item Layout

Standard watchlist item (unchanged):
```
│ AAPL    Apple Inc.              $189.84   +1.23%  ▲        │
```

Portfolio item with position:
```
│ AAPL    Apple Inc.              $189.84   +1.23%  ▲        │
│         50 shares · $9,492.00   Day: +$115.38              │
```

Portfolio item without position set:
```
│ AAPL    Apple Inc.              $189.84   +1.23%  ▲        │
│         — shares                                            │
```

### Section Headers

Watchlist:
```
├─────────────────────────────────────────────────────────────┤
│ ▼ Tech Stocks                                    5 items   │
├─────────────────────────────────────────────────────────────┤
```

Portfolio with totals:
```
├─────────────────────────────────────────────────────────────┤
│ ▼ Retirement Portfolio          $45,230.00    +$892.15 today│
├─────────────────────────────────────────────────────────────┤
```

### Empty States

No lists exist:
```
┌─────────────────────────────────────────────────────────────┐
│                         📊                                  │
│                  No lists yet                               │
│                                                             │
│         Create your first watchlist or portfolio            │
│                  to start tracking stocks.                  │
│                                                             │
│                  [Create List]                              │
└─────────────────────────────────────────────────────────────┘
```

List is empty:
```
┌─────────────────────────────────────────────────────────────┐
│                         📋                                  │
│              Tech Stocks is empty                           │
│                                                             │
│            Press ↵ or use "Add Stock" to                    │
│              add your first stock.                          │
└─────────────────────────────────────────────────────────────┘
```

### Confirmations

Delete list with items:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Delete "Tech Stocks"?                                   │
│                                                             │
│ This list contains 5 stocks. This action cannot be undone.  │
│                                                             │
│                              [Cancel]  [Delete]             │
└─────────────────────────────────────────────────────────────┘
```

Remove stock from portfolio with position:
```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️  Remove AAPL from Retirement Portfolio?                  │
│                                                             │
│ This will also delete your position data (50 shares).       │
│                                                             │
│                              [Cancel]  [Remove]             │
└─────────────────────────────────────────────────────────────┘
```

---

## v2.0 Implementation Phases

### Phase 1: Data Layer & Migration
- [ ] Define TypeScript interfaces for lists, items, settings
- [ ] Implement LocalStorage helpers (load, save, migrate)
- [ ] Create migration logic from v1 preferences
- [ ] Unit tests for data layer

### Phase 2: List Management
- [ ] "Manage Lists" command (CRUD for lists)
- [ ] Create/Edit list form with icon picker
- [ ] List reordering
- [ ] Delete with confirmation

### Phase 3: Main View Refactor
- [ ] Refactor My Stocks to render from LocalStorage lists
- [ ] Section-based layout with list headers (icon + name)
- [ ] Stock reordering within lists (Move Up/Down)
- [ ] Move stock between lists

### Phase 4: Add Stock Command
- [ ] Yahoo Finance search integration
- [ ] Search results view
- [ ] Add to list flow (single list, picker, quick-add)
- [ ] "Add with Position" flow

### Phase 5: Portfolio Features
- [ ] Edit Position form
- [ ] Portfolio mode list rendering (units, value, daily P&L)
- [ ] Section header totals
- [ ] Detail panel updates for portfolio items

### Phase 6: Export/Import & Polish
- [ ] Export Data command (JSON to clipboard)
- [ ] Import Data command (JSON from clipboard)
- [ ] Empty states for all views
- [ ] Error handling and confirmation dialogs
- [ ] E2E testing with mocked data
- [ ] Update README and screenshots

---

## Out of Scope (v2.0)

- Automatic cloud sync → Export/Import for v2.0; file-based sync planned for v2.1
- Import from brokerage accounts (CSV, API integrations)
- Price alerts / notifications
- Historical performance charts beyond detail panel
- Tax lot tracking (FIFO/LIFO)
- Dividends tracking
- Currency conversion for international stocks
- Menu bar extension (potential v3)

---



## v2.1 Roadmap: Zero-Config iCloud Sync

### Overview

Automatic sync via iCloud Drive for macOS users—no configuration needed. Just a one-time confirmation dialog to enable sync.

### Why iCloud?

| Option | Complexity | User Setup | Audience | v2.1 Status |
|--------|------------|------------|----------|-------------|
| **iCloud hardcoded** | Low | One-click enable | Mac + iCloud users | ✅ **This approach** |
| File in synced folder | Medium | Manual path entry | Power users | Future enhancement |
| Dropbox/S3 API | High | OAuth/credentials | Technical users | Out of scope |

**Rationale**: The vast majority of Mac users have iCloud enabled. Zero-config sync is the best UX. Power users who want Dropbox/other services can be supported in a future version with the manual file path approach.

### Configuration

**Preference** (add to `package.json`):
```json
{
  "name": "enableICloudSync",
  "type": "checkbox",
  "required": false,
  "title": "Enable iCloud Sync",
  "label": "Sync watchlists and portfolios across your Macs",
  "description": "Automatically sync your data via iCloud Drive. Works seamlessly across all your devices with iCloud enabled.",
  "default": false
}
```

**Hardcoded sync file location**:
```
~/Library/Mobile Documents/com~apple~CloudDocs/MyStocks/portfolio.json
```

- Standard iCloud Drive location for macOS
- Automatically synced by Apple across user's devices
- Hidden from Finder by default (no clutter)
- Extension creates directory and file automatically when sync is enabled

### Sync Logic

**Device ID** (stored in LocalStorage, generated once):
```typescript
interface SyncMetadata {
  deviceId: string;           // Generated UUID on first use, e.g., "MacBook-Pro-Work"
  lastSyncedAt: string | null;
}
```

**On extension load:**
1. Read LocalStorage (fast, always available)
2. Check `enableICloudSync` preference
3. If enabled:
   - Read iCloud sync file (if exists)
   - Compare `syncedAt` timestamps
   - Merge using newer timestamps per list
   - Write back to both LocalStorage and iCloud
   - Start file watcher

**On data change:**
1. Write to LocalStorage (instant, primary)
2. Check `enableICloudSync` preference
3. If enabled:
   - Write to iCloud file (async, non-blocking)
   - macOS automatically propagates to other devices

**File watching**:
- Use `fs.watch()` on the iCloud path when sync is enabled
- When file changes → trigger merge (handles writes from other devices)
- Debounce by 2 seconds to avoid thrashing during rapid changes
- Stop watching when preference is disabled

### Conflict Resolution

Last-write-wins at list level:
- Each `StockList` has `updatedAt` timestamp
- On merge: for each list ID, keep version with newer `updatedAt`
- New lists from either side are added
- Deleted lists: track in `tombstones` array, prune after 7 days

### Sync File Format

```json
{
  "version": 2,
  "syncedAt": "2025-01-15T10:30:00Z",
  "deviceId": "MacBook-Pro-Work",
  "lists": [...],
  "settings": {...},
  "tombstones": [
    { "listId": "abc-123", "deletedAt": "2025-01-14T08:00:00Z" }
  ]
}
```

### Setup UX

**No dialogs**—users enable sync via Raycast settings:

1. Open extension preferences (`⌘,` in My Stocks)
2. Check "Enable iCloud Sync"
3. Extension automatically:
   - Generates `deviceId` (if first time)
   - Merges with iCloud file (if exists on other devices)
   - Creates iCloud file (if first device)
   - Starts file watching
   - Shows toast: "✅ iCloud Sync enabled"

**Disabling sync** (uncheck preference):
- Stop file watching
- Keep iCloud file intact (don't delete)
- Keep LocalStorage data intact
- Shows toast: "iCloud Sync disabled · Local data preserved"

**Re-enabling sync**:
- Same merge logic as initial enable
- No data loss—merges local and iCloud data

**Optional: Sync status in Manage Lists** (for power users):
```
│ ⚙️ Sync Status                                              │
│   iCloud Sync: ✅ Enabled                                   │
│   Last synced: 2 minutes ago                                │
│   Device: MacBook-Pro-Work                                  │
│                                                             │
│   [Sync Now]  [View in iCloud Drive]                        │
```

This is **optional** visual feedback—sync works automatically via the preference toggle.

### v2.1 Implementation Phases

1. **Sync infrastructure**
   - [ ] Add `enableICloudSync` checkbox preference to `package.json`
   - [ ] Define `SyncMetadata` interface and LocalStorage helpers
   - [ ] Hardcode iCloud path: `~/Library/Mobile Documents/com~apple~CloudDocs/MyStocks/`
   - [ ] File read/write utilities with error handling (directory creation, permissions)
   - [ ] Generate unique `deviceId` on first sync enable

2. **Merge logic**
   - [ ] List-level last-write-wins (compare `updatedAt` per list)
   - [ ] Tombstone tracking for deletes (7-day retention)
   - [ ] Settings merge
   - [ ] Unit tests for merge scenarios (conflicts, new lists, deletes)

3. **File watching**
   - [ ] `fs.watch()` on iCloud path when sync enabled
   - [ ] Debounce (2s) and trigger merge on file modification
   - [ ] Handle watch errors gracefully (restart watcher)
   - [ ] Stop watcher when preference is disabled

4. **Preference integration**
   - [ ] Read `enableICloudSync` on extension load and data changes
   - [ ] Handle enable: generate deviceId, merge, start watcher, show toast
   - [ ] Handle disable: stop watcher, show toast
   - [ ] No blocking dialogs—all automatic

5. **Polish**
   - [ ] Optional Sync Status view in Manage Lists (last synced, device name)
   - [ ] Optional "Sync Now" manual action
   - [ ] Error toasts for sync failures (no iCloud, file locked, etc.)
   - [ ] Handle iCloud not available gracefully (check path accessibility before writes)

---

## File Structure (Proposed)

```
src/
├── my-stocks.tsx              # Main command (refactored)
├── add-stock.tsx              # New: Add Stock command
├── manage-lists.tsx           # New: Manage Lists command
├── export-lists.tsx           # New: Export Lists command
├── import-lists.tsx           # New: Import Lists command
├── components/
│   ├── StockItem.tsx          # List item component
│   ├── ListSection.tsx        # Section with header
│   ├── EditPositionForm.tsx   # Position editing form
│   └── ListForm.tsx           # Create/edit list form
├── data/
│   ├── quotes.ts              # Yahoo Finance quotes (existing)
│   ├── search.ts              # New: Yahoo Finance search
│   ├── lists.ts               # New: LocalStorage list operations
│   ├── export.ts              # New: Export/import serialization
│   └── migration.ts           # New: v1 → v2 migration
├── utils/
│   ├── symbols.ts             # Existing symbol parsing
│   ├── format.ts              # New: formatting helpers
│   └── refresher.ts           # Existing refresh utility
└── types.ts                   # New: shared type definitions
```

---

## Design Decisions (Resolved)

1. **List icons**: Yes—users can pick an emoji for each list. Store as optional `icon?: string` field. Default to contextual emoji based on list type (📋 for watchlist, 💼 for portfolio).

2. **Default list behavior**: Show all lists as sections in the main view. No dropdown filter needed for default case—search bar filters across all visible lists.

3. **Keyboard shortcut conflicts**: 
   - `⌘E` on a **stock item** → "Edit Position" (set units/cost)
   - `⌘E` on a **section header** → "Edit List" (rename, toggle portfolio mode)
   - Context makes intent clear. Both use `⌘E` because "Edit" is the common verb.

4. **Cost basis entry**: Total cost only. Show calculated per-share cost as hint text when both units and cost basis are entered.

---

## References

- Raycast Extensions API: https://developers.raycast.com
- yahoo-finance2 docs: https://github.com/gadicc/node-yahoo-finance2
- Existing codebase: See `AGENTS.md` and `src/` directory
- v1 brief: `docs/raycast-stocks-extension-brief.md`
