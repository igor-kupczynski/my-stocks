# AGENTS.md

Guidance for AI coding assistants working with this repository.

## Project Overview

Raycast extension displaying a stock watchlist with real-time prices. Built with React, TypeScript, and the Raycast Extensions API, fetching data from Yahoo Finance.

## Commands

```bash
npm install          # Setup
npm run dev          # Dev mode with hot reload
npm run build        # Build extension
npm test             # Run tests
npm run lint         # Check code style
npm run fix-lint     # Auto-fix lint issues
```

## Architecture

```
src/
├── my-stocks.tsx      # Main component: List view with toggleable detail panel
├── data/quotes.ts     # Yahoo Finance fetching with 1-min cache
├── utils/symbols.ts   # Parse comma-separated symbols
├── utils/refresher.ts # Auto-refresh every 60s
└── test/mocks/        # Raycast API mocks for testing
```

**Key patterns:**
- `QuoteResult` discriminated union: `{ ok: true, data } | { ok: false, symbol, error }`
- Detail panel toggled via `⌘D` (hidden by default for full-width list)
- Preferences in `package.json` under `commands[].preferences`

## Testing

- Tests mock `@raycast/api` via vitest alias
- Mock `getPreferenceValues` and `getQuotes` to control test data
- Use `@testing-library/react` with roles: `listitem`, `status`

## Code Style

- Strict TypeScript enabled
- Avoid `any`; use explicit types
- Follow existing patterns enforced by ESLint/Prettier

## Documentation

Keep `README.md` and `AGENTS.md` up to date when making significant changes, but keep them lean—document what's needed, not everything.
