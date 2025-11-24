# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension called "My Stocks" that displays a watchlist of stocks with current prices and daily performance. The extension mimics the sidebar of macOS Stocks app and is built using the Raycast Extensions API with React and TypeScript.

## Development Commands

### Build and Development
- `npm run dev` - Run extension in development mode with hot reload via Raycast
- `npm run build` - Build the extension using `ray build`

### Code Quality
- `npm run lint` - Run ESLint using `ray lint`
- `npm run fix-lint` - Auto-fix linting issues using `ray lint --fix`

### Publishing
- `npm run publish` - Publish to Raycast Store (uses `@raycast/api` publisher)

## Architecture

### Tech Stack
- **Framework**: Raycast Extensions API (React + TypeScript)
- **Market Data**: `yahoo-finance2` npm package for fetching stock prices
- **Type Safety**: Strict TypeScript with CommonJS modules targeting ES2023

### Project Structure
- `src/my-stocks.tsx` - Main command component (currently contains placeholder code)
- `package.json` - Extension manifest with commands, dependencies, and scripts
- `raycast-env.d.ts` - Auto-generated type definitions from manifest (do not edit manually)
- `tsconfig.json` - TypeScript configuration with strict mode enabled
- `eslint.config.js` - ESLint configuration using Raycast's config
- `docs/raycast-stocks-extension-brief.md` - Detailed specification for the extension

### Extension Configuration
The extension is configured in `package.json` under the Raycast schema:
- Single command: "My Stocks" (`my-stocks`)
- Mode: `view` (interactive list UI)
- Platforms: macOS and Windows

### Implementation Requirements (from brief)

**Core functionality to implement:**
1. Display list of user-configured stock symbols (from preferences)
2. For each stock, show:
   - Symbol and company name
   - Current price
   - Daily change ($ and %)
   - Visual indicator (green/red for positive/negative)
3. Default action: Open stock in macOS Stocks app (`stocks://` URL scheme) or Yahoo Finance fallback

**Data fetching:**
- Use `yahoo-finance2` to fetch: `symbol`, `shortName`, `regularMarketPrice`, `regularMarketChange`, `regularMarketChangePercent`
- User preferences for stock symbols (comma-separated list)
- Handle errors gracefully (invalid symbols, rate limits)

**Current state:**
The `src/my-stocks.tsx` file contains only placeholder code with dummy items. The actual stock fetching and display logic needs to be implemented according to the specification in `docs/raycast-stocks-extension-brief.md`.

## Raycast-Specific Notes
- `raycast-env.d.ts` is auto-generated from `package.json` - modify the manifest instead
- Use Raycast API components: `List`, `ActionPanel`, `Action`, etc. from `@raycast/api`
- Extension preferences are defined in `package.json` and typed in `raycast-env.d.ts`
- Test changes using `npm run dev` which launches the extension in Raycast's development mode
