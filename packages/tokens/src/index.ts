// ============================================================
// @mastors/tokens — Design Token Integration Layer
// Mastors Intent-Based Styling Framework v0.1.0
// ============================================================

import type { TokenMap, TokenValue, ResolvedTokenValue } from "@mastors/types";
import { resolveTokenPath, tokenPathToCssVar } from "@mastors/utils";

// ── Default Token Scale ──────────────────────────────────────

/**
 * The built-in Mastors default token scale.
 * Projects can override any value via their mastors.config.ts.
 */
export const defaultTokens: TokenMap = {
  token: {
    // Spacing scale (4pt base)
    space: {
      "0": "0",
      "1": "0.25rem",
      "2": "0.5rem",
      "3": "0.75rem",
      "4": "1rem",
      "5": "1.25rem",
      "6": "1.5rem",
      "8": "2rem",
      "10": "2.5rem",
      "12": "3rem",
      "16": "4rem",
      "20": "5rem",
      "24": "6rem",
    },
    // Typography scale
    text: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
      "5xl": "3rem",
    },
    // Font weight
    weight: {
      normal: "400",
      medium: "500",
      semibold: "600",
      bold: "700",
    },
    // Line heights
    leading: {
      none: "1",
      tight: "1.25",
      snug: "1.375",
      normal: "1.5",
      relaxed: "1.625",
      loose: "2",
    },
    // Border radius
    radius: {
      none: "0",
      sm: "0.125rem",
      base: "0.25rem",
      md: "0.375rem",
      lg: "0.5rem",
      xl: "0.75rem",
      "2xl": "1rem",
      "3xl": "1.5rem",
      full: "9999px",
    },
    // Box shadows (elevation scale)
    shadow: {
      none: "none",
      sm: "0 1px 2px 0 rgb(0 0 0 / 0.05)",
      base: "0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)",
      md: "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
      elevated: "0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)",
      lg: "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
      xl: "0 25px 50px -12px rgb(0 0 0 / 0.25)",
    },
    // Semantic colors
    color: {
      primary: {
        "50": "#eff6ff",
        "100": "#dbeafe",
        "500": "#3b82f6",
        "600": "#2563eb",
        "700": "#1d4ed8",
        "900": "#1e3a8a",
      },
      neutral: {
        "0": "#ffffff",
        "50": "#f9fafb",
        "100": "#f3f4f6",
        "200": "#e5e7eb",
        "300": "#d1d5db",
        "400": "#9ca3af",
        "500": "#6b7280",
        "700": "#374151",
        "800": "#1f2937",
        "900": "#111827",
        "1000": "#000000",
      },
      success: {
        "100": "#dcfce7",
        "500": "#22c55e",
        "700": "#15803d",
      },
      warning: {
        "100": "#fef9c3",
        "500": "#eab308",
        "700": "#a16207",
      },
      error: {
        "100": "#fee2e2",
        "500": "#ef4444",
        "700": "#b91c1c",
      },
    },
    // Z-index scale
    z: {
      behind: "-1",
      base: "0",
      raised: "10",
      dropdown: "100",
      sticky: "200",
      overlay: "300",
      modal: "400",
      toast: "500",
    },
    // Transition durations
    duration: {
      instant: "0ms",
      fast: "100ms",
      normal: "200ms",
      slow: "300ms",
      slower: "500ms",
    },
    // Easing functions
    easing: {
      linear: "linear",
      natural: "cubic-bezier(0.4, 0, 0.2, 1)",
      "ease-in": "cubic-bezier(0.4, 0, 1, 1)",
      "ease-out": "cubic-bezier(0, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },
};

// ── Token Registry ───────────────────────────────────────────

export class TokenRegistry {
  private tokens: TokenMap;

  constructor(tokens: TokenMap = defaultTokens) {
    this.tokens = tokens;
  }

  /**
   * Resolve a token path to its raw value.
   */
  resolve(path: string): TokenValue | undefined {
    return resolveTokenPath(path, this.tokens);
  }

  /**
   * Resolve a token path to a CSS custom property reference with fallback.
   */
  resolveToVar(path: string): ResolvedTokenValue {
    const cssVar = tokenPathToCssVar(path);
    const fallback = this.resolve(path) ?? "unset";
    return { cssVar, fallback };
  }

  /**
   * Generate a CSS string block declaring all token custom properties.
   */
  generateCssVars(selector = ":root"): string {
    const vars = this.flattenToCssVars(this.tokens, "");
    const lines = vars.map(([k, v]) => `  ${k}: ${v};`).join("\n");
    return `${selector} {\n${lines}\n}`;
  }

  private flattenToCssVars(
    obj: TokenMap,
    prefix: string
  ): [string, string][] {
    const result: [string, string][] = [];
    for (const [key, value] of Object.entries(obj)) {
      const name = prefix ? `${prefix}-${key}` : key;
      if (typeof value === "object") {
        result.push(...this.flattenToCssVars(value as TokenMap, name));
      } else {
        result.push([`--mastors-${name.replace(/^token-/, "")}`, String(value)]);
      }
    }
    return result;
  }

  /**
   * Merge additional tokens on top of the current registry.
   */
  extend(overrides: TokenMap): TokenRegistry {
    const merged = deepMergeTokens(this.tokens, overrides);
    return new TokenRegistry(merged);
  }
}

function deepMergeTokens(base: TokenMap, override: TokenMap): TokenMap {
  const result: Record<string, TokenValue | TokenMap> = { ...base };
  for (const key of Object.keys(override)) {
    const bv = base[key];
    const ov = override[key];
    if (typeof bv === "object" && typeof ov === "object") {
      result[key] = deepMergeTokens(bv as TokenMap, ov as TokenMap);
    } else {
      result[key] = ov as TokenValue;
    }
  }
  return result as TokenMap;
}

// ── Default Registry Singleton ───────────────────────────────

export const defaultRegistry = new TokenRegistry(defaultTokens);
