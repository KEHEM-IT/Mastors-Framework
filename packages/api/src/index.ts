// ============================================================
// @mastors/api — Intent Declaration API (Layer 1)
// Mastors Intent-Based Styling Framework v0.1.0
//
// The public developer-facing API. Developers use intent(),
// semantics(), and compose() to declare design intent.
// ============================================================

import type {
  IntentId,
  IntentContext,
  IntentDescriptor,
  MastorsSchema,
  MastorsConfig,
} from "@mastors/types";
import { SemanticResolver } from "@mastors/core";
import { MastorsCompiler } from "@mastors/compiler";
import { defaultSchema, defineSchema } from "@mastors/schemas";

// ── Global Mastors Instance ──────────────────────────────────

let _resolver: SemanticResolver = new SemanticResolver(defaultSchema);
let _compiler: MastorsCompiler | null = null;
let _config: MastorsConfig | null = null;

// ── configure() ─────────────────────────────────────────────

/**
 * Initialize Mastors with a project-level config.
 * Call this once at the top of your app / in mastors.config.ts.
 *
 * @example
 * configure({
 *   schema: defineSchema({ tokens: "./tokens.json", vocabulary: { ... } }),
 *   a11yMode: "enforce",
 * });
 */
export function configure(config: MastorsConfig): void {
  _config = config;
  _resolver = new SemanticResolver(config.schema);
  _compiler = new MastorsCompiler(config);
}

// ── intent() ────────────────────────────────────────────────

/**
 * Declare a semantic intent for a UI element.
 * Returns an IntentDescriptor that adapters convert to class names.
 *
 * @example
 * const card = intent("card.elevated.interactive");
 * // → IntentDescriptor { id: "card.elevated.interactive", ... }
 */
export function intent(raw: string, context: IntentContext = {}): IntentDescriptor {
  return _resolver.describe(raw, context);
}

/**
 * Resolve an intent directly to a CSS class string.
 * Useful in non-adapter contexts (vanilla HTML, SSR strings).
 *
 * @example
 * const classes = intentClass("button.primary.cta");
 * // → "m-padding-left-abc123 m-background-color-def456 m-intent-button-primary-cta"
 */
export function intentClass(raw: string, context: IntentContext = {}): string {
  if (!_compiler) {
    throw new Error("Mastors: call configure() before using intentClass()");
  }
  return _compiler.classesFor(
    _resolver.describe(raw, context).id as IntentId
  );
}

// ── semantics() ─────────────────────────────────────────────

/**
 * Define global semantic rules that apply across the project.
 * Merges into the active schema vocabulary.
 *
 * @example
 * semantics({
 *   "financial.data.negative": {
 *     color: { foreground: "token.color.error.700" },
 *   }
 * });
 */
export function semantics(
  vocabulary: MastorsSchema["vocabulary"]
): void {
  const current = (_config?.schema ?? defaultSchema);
  const merged: MastorsSchema = {
    ...current,
    vocabulary: { ...current.vocabulary, ...vocabulary },
  };
  _resolver.setSchema(merged);
  if (_config) {
    _config = { ..._config, schema: merged };
    _compiler = new MastorsCompiler(_config);
  }
}

// ── compose() ───────────────────────────────────────────────

/**
 * Combine multiple intent identifiers into a composed descriptor.
 * The last intent in the list takes precedence for conflicting rules.
 *
 * @example
 * const heroCard = compose("card.elevated", "card.elevated.interactive");
 */
export function compose(...rawIds: string[]): IntentDescriptor {
  if (rawIds.length === 0) {
    throw new Error("Mastors: compose() requires at least one intent identifier");
  }
  // Return the last (most specific) descriptor — resolver handles inheritance
  const last = rawIds[rawIds.length - 1]!;
  return _resolver.describe(last);
}

// ── compile() ───────────────────────────────────────────────

/**
 * Compile a list of intent IDs to a full CSS output bundle.
 * Called by build plugins — not typically used directly.
 */
export function compile(intentIds: string[]) {
  if (!_compiler) {
    throw new Error("Mastors: call configure() before compile()");
  }
  return _compiler.compile(intentIds.map((id) => id as IntentId));
}

// ── Re-exports ───────────────────────────────────────────────

export { defineSchema } from "@mastors/schemas";
export type {
  IntentId,
  IntentDescriptor,
  IntentContext,
  MastorsSchema,
  MastorsConfig,
  CompiledOutput,
} from "@mastors/types";
