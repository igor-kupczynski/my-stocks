# My Stocks

View your stock watchlist with current prices and daily performance directly in Raycast.

## Overview

This is a Raycast extension that displays a stock watchlist with real-time prices and daily performance. It is built with React, TypeScript, and the Raycast Extensions API, and fetches market data from Yahoo Finance.

## Features

- **Watchlist**: View a list of user-configured stock symbols.
- **Real-time Data**: Displays current price, daily change (absolute and percentage).
- **Visual Indicators**: Color-coded performance indicators (Green for positive, Red for negative).
- **Quick Actions**:
    - Open the selected stock in the native **macOS Stocks** app.
    - Fallback to **Yahoo Finance** website if the Stocks app doesn't open.
- **Customizable**: Configure your own list of stock symbols via Raycast Preferences.

## Requirements

- **Node.js**: Required for development and building.
- **Raycast**: The application where this extension runs.

## Installation

1.  Clone the repository:
    ```bash
    git clone https://github.com/igor-kupczynski/my-stocks.git
    cd my-stocks
    ```

2.  Install dependencies:
    ```bash
    npm install
    ```

## Configuration

To configure the stocks you want to watch:

1.  Open Raycast Settings.
2.  Go to **Extensions** > **My Stocks**.
3.  Edit the **Stock Symbols** preference.
    -   Format: Comma-separated list of symbols (e.g., `AAPL, GOOGL, MSFT, TSLA`).
    -   Default: `AAPL, GOOGL, MSFT, TSLA`.

## Development

### Running in Development Mode

Start the extension in development mode with hot reloading:

```bash
npm run dev
```

### Building for Production

Build the extension for distribution:

```bash
npm run build
```

### Linting

Check and fix code style issues:

```bash
npm run lint      # Check
npm run fix-lint  # Auto-fix
```

### Testing

Run the test suite using Vitest:

```bash
npm test          # Run once
npm run test:watch # Run in watch mode
```

## Project Structure

```text
src/
├── my-stocks.tsx          # Main command component (List view with state management)
├── data/
│   └── quotes.ts          # Yahoo Finance data fetching with 1-minute cache
├── utils/
│   ├── symbols.ts         # Parse/dedupe comma-separated symbols
│   └── refresher.ts       # Auto-refresh utility
└── test/
    └── mocks/
        └── raycast-api.tsx  # Mock Raycast API for testing
```

## Tech Stack

-   **Runtime**: Node.js
-   **Framework**: Raycast Extensions API (React + TypeScript)
-   **Language**: TypeScript
-   **Data Source**: `yahoo-finance2`
-   **Testing**: Vitest, React Testing Library, Happy DOM

## License

MIT