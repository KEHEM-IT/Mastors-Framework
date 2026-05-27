// ============================================================
// mastors.config.ts — Example Project Configuration
// Copy this file to your project root and customize it.
// ============================================================

import { defineSchema } from "@mastors/schemas";

export default defineSchema({
  // Path to your design token JSON file.
  // Supports Style Dictionary, Figma Tokens (W3C format), or the
  // Mastors default format (see schemas/tokens.default.json).
  tokens: "./schemas/tokens.default.json",

  // Extend or override the built-in semantic vocabulary.
  // Keys use dot-notation: "category.variant.modifier"
  vocabulary: {
    // ── Example: domain-specific intent ──────────────────────
    // Add your own intents on top of the built-in vocabulary.

    // Financial data — negative value indicator
    "financial.data.negative": {
      color: {
        foreground: "token.color.error.700",
      },
      typography: {
        weight: "token.weight.semibold",
      },
      a11y: { contrast: "AA" },
    },

    // Financial data — positive value indicator
    "financial.data.positive": {
      color: {
        foreground: "token.color.success.700",
      },
      typography: {
        weight: "token.weight.semibold",
      },
      a11y: { contrast: "AA" },
    },

    // Custom hero section for marketing pages
    "section.hero.marketing": {
      spacing: { x: "token.space.8", y: "token.space.16" },
      color: {
        background: "token.color.primary.50",
      },
      a11y: { contrast: "AAA" },
    },
  },

  // Optional: register custom themes
  // Each key is a theme name; values override token paths.
  themes: {
    dark: {
      "token.color.neutral.0":    "#111827",
      "token.color.neutral.50":   "#1f2937",
      "token.color.neutral.100":  "#374151",
      "token.color.neutral.800":  "#f9fafb",
      "token.color.neutral.900":  "#ffffff",
    },
  },
});
