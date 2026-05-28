// ============================================================
// Mastors Playground — vite.config.ts
// ============================================================

import { defineConfig } from "vite";
import path from "path";

export default defineConfig({
  root: __dirname,
  resolve: {
    alias: {
      "@mastors/types":          path.resolve(__dirname, "../packages/types/src/index.ts"),
      "@mastors/utils":          path.resolve(__dirname, "../packages/utils/src/index.ts"),
      "@mastors/tokens":         path.resolve(__dirname, "../packages/tokens/src/index.ts"),
      "@mastors/schemas":        path.resolve(__dirname, "../packages/schemas/src/index.ts"),
      "@mastors/core":           path.resolve(__dirname, "../packages/core/src/index.ts"),
      "@mastors/accessibility":  path.resolve(__dirname, "../packages/accessibility/src/index.ts"),
      "@mastors/compiler":       path.resolve(__dirname, "../packages/compiler/src/index.ts"),
      "@mastors/api":            path.resolve(__dirname, "../packages/api/src/index.ts"),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
  },
});
