// ============================================================
// Mastors — vitest.config.ts (root)
// ============================================================

import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["packages/*/src/**/*.test.ts", "packages/*/src/**/*.spec.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["packages/*/src/**/*.ts"],
      exclude: ["**/*.test.ts", "**/*.spec.ts", "**/index.ts"],
    },
  },
  resolve: {
    alias: {
      "@mastors/types":         path.resolve(__dirname, "packages/types/src/index.ts"),
      "@mastors/utils":         path.resolve(__dirname, "packages/utils/src/index.ts"),
      "@mastors/tokens":        path.resolve(__dirname, "packages/tokens/src/index.ts"),
      "@mastors/schemas":       path.resolve(__dirname, "packages/schemas/src/index.ts"),
      "@mastors/core":          path.resolve(__dirname, "packages/core/src/index.ts"),
      "@mastors/accessibility": path.resolve(__dirname, "packages/accessibility/src/index.ts"),
      "@mastors/compiler":      path.resolve(__dirname, "packages/compiler/src/index.ts"),
      "@mastors/api":           path.resolve(__dirname, "packages/api/src/index.ts"),
    },
  },
});
