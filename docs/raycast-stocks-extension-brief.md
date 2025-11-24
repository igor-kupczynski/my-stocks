# Raycast Extension Brief: My Stocks

## Overview
Build a Raycast extension that displays a watchlist of stocks with current prices and daily performance, mimicking the sidebar of macOS Stocks app.

## Core Functionality

### Main Command: "My Stocks"
- Display a list view of user-configured stock symbols
- Each list item shows:
  - Stock symbol (e.g., AAPL)
  - Company name
  - Current price
  - Daily change (absolute $ and %)
  - Visual indicator: green for positive, red for negative

### Default Action
- Open the selected stock in the native macOS Stocks app
- Use URL scheme: `stocks://symbol=AAPL` or AppleScript fallback
- If Stocks app integration fails, fall back to Yahoo Finance web (`https://finance.yahoo.com/quote/AAPL`)

## Technical Requirements

### Stack
- Raycast Extensions API (React + TypeScript)
- `yahoo-finance2` npm package for market data

### Configuration (via Raycast Extension Preferences)
- `stockSymbols`: Comma-separated list of stock symbols (e.g., `AAPL, GOOGL, MSFT, TSLA`)
- Optional: refresh interval preference (default: on-demand)

### Data to Fetch
For each symbol, retrieve:
- `symbol`
- `shortName` (company name)
- `regularMarketPrice`
- `regularMarketChange`
- `regularMarketChangePercent`

## UI Specifications

### List View Layout
```
┌─────────────────────────────────────────────┐
│ 🔍 My Stocks                                │
├─────────────────────────────────────────────┤
│ AAPL          Apple Inc.                    │
│               $189.84    +1.23 (+0.65%) ▲   │
├─────────────────────────────────────────────┤
│ GOOGL         Alphabet Inc.                 │
│               $141.80    -0.54 (-0.38%) ▼   │
├─────────────────────────────────────────────┤
│ MSFT          Microsoft Corporation         │
│               $378.91    +2.10 (+0.56%) ▲   │
└─────────────────────────────────────────────┘
```

### Accessories (right side of each item)
- Price in bold
- Change with color coding (green/red)
- Up/down arrow or icon

## Error Handling
- Show inline error if a symbol is invalid
- Show empty state with instructions if no stocks configured
- Handle API rate limits gracefully (cache results for ~1 min)

## Out of Scope (v1)
- Adding/removing stocks via commands (use preferences only)
- Detailed stock view within Raycast
- Price alerts or notifications
- Portfolio tracking with quantities/cost basis

## Reference
- Raycast Extensions docs: https://developers.raycast.com
- yahoo-finance2: https://www.npmjs.com/package/yahoo-finance2
- macOS Stocks URL scheme: `stocks://`
