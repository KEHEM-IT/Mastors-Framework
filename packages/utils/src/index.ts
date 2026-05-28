// ============================================================
// @mastors/utils — Shared Utility Functions
// Mastors Intent-Based Styling Framework v0.1.0
// ============================================================

import type { IntentId, IntentSegments, TokenMap, TokenValue } from "@mastors/types";

// ── Intent Parsing ───────────────────────────────────────────

/**
 * Parse a dot-notation intent string into its segments.
 * e.g. "card.elevated.interactive" → { category: "card", variant: "elevated", modifier: "interactive" }
 */
export function parseIntentId(raw: string): IntentSegments {
  const parts = raw.trim().split(".");
  const result: {
    category: string;
    variant?: string;
    modifier?: string;
    raw: string;
  } = {
    category: parts[0] ?? "",
    raw,
  };
  if (parts[1] !== undefined) result.variant = parts[1];
  if (parts[2] !== undefined) result.modifier = parts[2];
  return result;
}

/**
 * Brand a plain string as an IntentId.
 */
export function toIntentId(raw: string): IntentId {
  return raw as IntentId;
}

/**
 * Validate that an intent string matches the expected format.
 */
export function isValidIntentId(raw: string): boolean {
  return /^[a-z][a-z0-9]*(\.[a-z][a-z0-9-]*){0,3}$/.test(raw);
}

// ── Token Path Utilities ─────────────────────────────────────

/**
 * Resolve a dot-notation token path against a token map.
 * e.g. "token.space.4" → looks up map.token.space["4"]
 */
export function resolveTokenPath(path: string, tokenMap: TokenMap): TokenValue | undefined {
  const segments = path.split(".");
  let current: TokenMap | TokenValue = tokenMap;
  for (const seg of segments) {
    if (typeof current !== "object" || current === null) return undefined;
    current = (current as TokenMap)[seg] as TokenMap | TokenValue;
  }
  return typeof current === "object" ? undefined : current;
}

/**
 * Convert a token path to a CSS custom property name.
 * e.g. "token.space.4" → "--mastors-space-4"
 */
export function tokenPathToCssVar(path: string): string {
  return "--mastors-" + path.replace(/^token\./, "").replace(/\./g, "-");
}

// ── CSS Utilities ────────────────────────────────────────────

/**
 * Generate an atomic CSS class name from a property + value hash.
 * Ensures deterministic, collision-free class names.
 */
export function generateAtomicClass(property: string, value: string | number): string {
  const key = `${property}:${value}`;
  const hash = simpleHash(key);
  const prop = property.replace(/[^a-zA-Z]/g, "-").toLowerCase();
  return `m-${prop}-${hash}`;
}

/**
 * A simple, fast non-cryptographic string hash (djb2 variant).
 */
export function simpleHash(str: string): string {
  let h = 5381;
  for (let i = 0; i < str.length; i++) {
    h = ((h << 5) + h) ^ (str.charCodeAt(i) | 0);
  }
  return (h >>> 0).toString(36);
}

/**
 * Convert camelCase CSS property names to kebab-case.
 * e.g. "backgroundColor" → "background-color"
 */
export function camelToKebab(str: string): string {
  return str.replace(/([A-Z])/g, (c) => `-${c.toLowerCase()}`);
}

// ── Deep Merge ───────────────────────────────────────────────

/**
 * Deep merge two plain objects. Source overrides target.
 */
export function deepMerge<T extends Record<string, unknown>>(
  target: T,
  source: Partial<T>
): T {
  const result = { ...target };
  for (const key of Object.keys(source) as (keyof T)[]) {
    const sv = source[key];
    const tv = target[key];
    if (isPlainObject(sv) && isPlainObject(tv)) {
      result[key] = deepMerge(tv as Record<string, unknown>, sv as Record<string, unknown>) as T[keyof T];
    } else if (sv !== undefined) {
      result[key] = sv as T[keyof T];
    }
  }
  return result;
}

function isPlainObject(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}
