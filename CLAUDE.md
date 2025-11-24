# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A Raycast extension that displays a stock watchlist with real-time prices and daily performance. Built with React, TypeScript, and the Raycast Extensions API, fetching market data from Yahoo Finance.

## Development Commands

### Build and Development
- `npm run dev` - Run extension in development mode with hot reload in Raycast
- `npm run build` - Build the extension using `ray build`

### Testing
- `npm test` - Run all tests once with Vitest
- `npm run test:watch` - Run tests in watch mode
- Tests use `happy-dom` environment and mock `@raycast/api` via `vitest.config.ts` alias

### Code Quality
- `npm run lint` - Run ESLint and Prettier via `ray lint`
- `npm run fix-lint` - Auto-fix linting issues using `ray lint --fix`

### Publishing
- `npm run publish` - Publish to Raycast Store (NOT npm)

## Architecture

### Tech Stack
- **Framework**: Raycast Extensions API (React + TypeScript)
- **Market Data**: `yahoo-finance2` npm package
- **Testing**: Vitest with Testing Library and happy-dom
- **Type Safety**: Strict TypeScript, CommonJS modules, ES2023 target

### Code Organization

```
src/
├── my-stocks.tsx          # Main command component (List view with state management)
├── data/
│   └── quotes.ts          # Yahoo Finance data fetching with 1-minute cache
├── utils/
│   ├── symbols.ts         # Parse/dedupe comma-separated symbols
│   └── refresher.ts       # Auto-refresh utility (runs callback immediately + periodic)
└── test/
    └── mocks/
        └── raycast-api.tsx  # Mock Raycast API for testing
```

### Key Implementation Details

**Data Flow:**
1. User preferences (`stockSymbols`) → parsed by `parseSymbols()` → deduped/uppercased
2. `getQuotes()` fetches from Yahoo Finance with 1-minute TTL cache per symbol
3. `startRefresher()` auto-refreshes every 60 seconds (immediate + periodic)
4. Component displays quotes in List with color-coded accessories (green ▲/red ▼)

**Error Handling:**
- Invalid symbols return `{ symbol, error }` instead of throwing
- Errors displayed inline with ExclamationMark icon
- Graceful fallback: macOS Stocks app (`stocks://`) → Yahoo Finance web

**Raycast-Specific:**
- `raycast-env.d.ts` is auto-generated from `package.json` manifest - edit the manifest, not this file
- Extension preferences in `package.json` under `commands[].preferences`
- Default symbols: AAPL, GOOGL, MSFT, TSLA

### Testing

Tests mock `@raycast/api` using path alias in `vitest.config.ts`. The mock renders React components as simple DOM elements with ARIA roles. When writing tests:
- Mock `getPreferenceValues` to control input symbols
- Mock `getQuotes` from `./data/quotes` to inject test data
- Use `@testing-library/react` queries with roles: `listitem`, `status`
- Avoid `any` type - use explicit types or type guards instead
