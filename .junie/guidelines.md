# Project Guidelines

## 1. Build/Configuration Instructions

### Setup
1.  Ensure you have Node.js installed.
2.  Run `npm install` to install dependencies.

### Development
-   Run `npm run dev` to start the extension in development mode with hot reload in Raycast.
-   Run `npm run lint` to run ESLint and Prettier.
-   Run `npm run fix-lint` to automatically fix linting issues.

### Build
-   Run `npm run build` to build the extension for production.

## 2. Testing Information

### Configuration
Tests are configured using **Vitest** in `vitest.config.ts`. The `@raycast/api` module is mocked globally using an alias that points to `src/test/mocks/raycast-api.tsx`.

### Running Tests
-   `npm test`: Runs all tests once.
-   `npm run test:watch`: Runs tests in watch mode.

### Adding New Tests
1.  Create a file ending in `.test.ts` or `.test.tsx` in the `src` directory or a `__tests__` subdirectory.
2.  Import testing utilities from `vitest` and `@testing-library/react`.
3.  When testing components that use the Raycast API, remember that `@raycast/api` is already mocked. You can import `getPreferenceValues` or other API methods to verify they are called or to mock their return values using `vi.mocked()`.

### Example Test
Here is a simple example of a test file structure:

```typescript
import { describe, it, expect } from "vitest";
import { getPreferenceValues } from "@raycast/api";

describe("Example Test", () => {
  it("should demonstrate test setup", () => {
    // Verify that the mocked API is accessible
    expect(getPreferenceValues).toBeDefined();
    
    // Example assertion
    const sum = 1 + 1;
    expect(sum).toBe(2);
  });
});
```

## 3. Additional Development Information

### Code Style
-   The project uses **React** and **TypeScript**.
-   **Strict TypeScript** mode is enabled (`strict: true` in `tsconfig.json`).
-   Follow the existing code style enforced by ESLint and Prettier.
-   Avoid using `any`; use explicit types.

### Project Structure
-   `src/`: Source code.
    -   `data/`: Data fetching logic (e.g., Yahoo Finance).
    -   `utils/`: Utility functions.
    -   `test/`: Test configuration and mocks.
-   `raycast-env.d.ts`: Auto-generated Raycast environment definitions.
