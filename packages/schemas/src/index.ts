// ============================================================
// @mastors/schemas — Built-in Semantic Vocabulary
// Mastors Intent-Based Styling Framework v0.1.0
// ============================================================

import type { MastorsSchema, VocabularyEntry } from "@mastors/types";

// ── Built-in Vocabulary ──────────────────────────────────────

const builtinVocabulary: Record<string, VocabularyEntry> = {
  // ── Cards ──────────────────────────────────────────────────
  "card.base": {
    spacing: { x: "token.space.4", y: "token.space.4" },
    radius: "token.radius.lg",
    color: {
      background: "token.color.neutral.0",
      border: "token.color.neutral.200",
    },
    a11y: { role: "article", contrast: "AA" },
  },
  "card.elevated": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    shadow: "token.shadow.elevated",
    radius: "token.radius.lg",
    color: {
      background: "token.color.neutral.0",
    },
    a11y: { role: "article", contrast: "AA" },
  },
  "card.elevated.interactive": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    shadow: "token.shadow.elevated",
    radius: "token.radius.lg",
    color: {
      background: "token.color.neutral.0",
    },
    interaction: { hover: "lift", focus: "ring.primary", active: "press" },
    motion: "transition.natural",
    a11y: { role: "article", contrast: "AA" },
  },

  // ── Buttons ────────────────────────────────────────────────
  "button.primary": {
    spacing: { x: "token.space.4", y: "token.space.2" },
    radius: "token.radius.md",
    color: {
      background: "token.color.primary.600",
      foreground: "token.color.neutral.0",
    },
    interaction: { hover: "darken", focus: "ring.primary", active: "press" },
    motion: "transition.natural",
    a11y: { contrast: "AA" },
  },
  "button.primary.cta": {
    spacing: { x: "token.space.6", y: "token.space.3" },
    radius: "token.radius.md",
    color: {
      background: "token.color.primary.600",
      foreground: "token.color.neutral.0",
    },
    interaction: { hover: "darken", focus: "ring.primary", active: "press" },
    motion: "transition.natural",
    a11y: { contrast: "AAA" },
  },
  "button.secondary": {
    spacing: { x: "token.space.4", y: "token.space.2" },
    radius: "token.radius.md",
    color: {
      background: "token.color.neutral.100",
      foreground: "token.color.neutral.800",
      border: "token.color.neutral.300",
    },
    interaction: { hover: "lighten", focus: "ring.primary", active: "press" },
    motion: "transition.natural",
    a11y: { contrast: "AA" },
  },
  "button.destructive": {
    spacing: { x: "token.space.4", y: "token.space.2" },
    radius: "token.radius.md",
    color: {
      background: "token.color.error.500",
      foreground: "token.color.neutral.0",
    },
    interaction: { hover: "darken", focus: "ring.error", active: "press" },
    motion: "transition.natural",
    a11y: { contrast: "AA" },
  },

  // ── Typography ─────────────────────────────────────────────
  "heading.hero": {
    typography: {
      size: "token.text.5xl",
      weight: "token.weight.bold",
      lineHeight: "token.leading.tight",
    },
    a11y: { contrast: "AAA" },
  },
  "heading.section": {
    typography: {
      size: "token.text.3xl",
      weight: "token.weight.bold",
      lineHeight: "token.leading.tight",
    },
    a11y: { contrast: "AAA" },
  },
  "heading.subsection": {
    typography: {
      size: "token.text.xl",
      weight: "token.weight.semibold",
      lineHeight: "token.leading.snug",
    },
    a11y: { contrast: "AA" },
  },
  "body.readable": {
    typography: {
      size: "token.text.base",
      weight: "token.weight.normal",
      lineHeight: "token.leading.relaxed",
    },
    a11y: { contrast: "AA" },
  },
  "body.readable.longform": {
    typography: {
      size: "token.text.lg",
      weight: "token.weight.normal",
      lineHeight: "token.leading.loose",
    },
    a11y: { contrast: "AA" },
  },

  // ── Navigation ─────────────────────────────────────────────
  "nav.primary": {
    spacing: { x: "token.space.6", y: "token.space.4" },
    color: {
      background: "token.color.neutral.0",
      border: "token.color.neutral.200",
    },
    a11y: { role: "navigation", contrast: "AA" },
  },
  "nav.primary.sticky": {
    spacing: { x: "token.space.6", y: "token.space.4" },
    color: {
      background: "token.color.neutral.0",
      border: "token.color.neutral.200",
    },
    shadow: "token.shadow.base",
    a11y: { role: "navigation", contrast: "AA" },
  },

  // ── Alerts & Feedback ──────────────────────────────────────
  "alert.info": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    radius: "token.radius.md",
    color: {
      background: "token.color.primary.50",
      foreground: "token.color.primary.700",
      border: "token.color.primary.200",
    },
    a11y: { role: "status", contrast: "AA" },
  },
  "alert.success": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    radius: "token.radius.md",
    color: {
      background: "token.color.success.100",
      foreground: "token.color.success.700",
    },
    a11y: { role: "status", contrast: "AA" },
  },
  "alert.warning": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    radius: "token.radius.md",
    color: {
      background: "token.color.warning.100",
      foreground: "token.color.warning.700",
    },
    a11y: { role: "alert", contrast: "AA" },
  },
  "alert.destructive": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    radius: "token.radius.md",
    color: {
      background: "token.color.error.100",
      foreground: "token.color.error.700",
    },
    a11y: { role: "alert", contrast: "AA" },
  },
  "toast.success.transient": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    radius: "token.radius.lg",
    shadow: "token.shadow.lg",
    color: {
      background: "token.color.neutral.800",
      foreground: "token.color.neutral.0",
    },
    motion: "animate.slide-up.spring",
    a11y: { role: "status", contrast: "AA" },
  },

  // ── Layout ─────────────────────────────────────────────────
  "container.max.centered": {
    spacing: { x: "token.space.6", y: "token.space.0" },
    a11y: { contrast: "AA" },
  },
  "grid.autofill.dense": {
    a11y: { contrast: "AA" },
  },

  // ── Form elements ──────────────────────────────────────────
  "form.field": {
    spacing: { x: "token.space.3", y: "token.space.2" },
    radius: "token.radius.md",
    color: {
      background: "token.color.neutral.0",
      border: "token.color.neutral.300",
    },
    interaction: { focus: "ring.primary" },
    a11y: { contrast: "AA" },
  },
  "form.destructive.confirm": {
    spacing: { x: "token.space.4", y: "token.space.3" },
    radius: "token.radius.lg",
    color: {
      background: "token.color.error.100",
      border: "token.color.error.500",
    },
    a11y: { role: "dialog", contrast: "AA" },
  },
};

// ── defineSchema Helper ──────────────────────────────────────

/**
 * Type-safe schema definition function. Use in mastors.config.ts.
 *
 * @example
 * export default defineSchema({
 *   tokens: "./tokens/global.json",
 *   vocabulary: {
 *     "card.elevated.interactive": { ... }
 *   }
 * });
 */
export function defineSchema(schema: MastorsSchema): MastorsSchema {
  return schema;
}

/**
 * The default Mastors schema using the built-in vocabulary.
 * Projects extend this via defineSchema() in mastors.config.ts.
 */
export const defaultSchema: MastorsSchema = {
  tokens: "@mastors/tokens",
  vocabulary: builtinVocabulary,
};

export { builtinVocabulary };
