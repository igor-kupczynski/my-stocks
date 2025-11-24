import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    alias: {
      "@raycast/api": path.join(process.cwd(), "src/test/mocks/raycast-api.tsx"),
    },
  },
});
