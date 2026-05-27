// ============================================================
// @mastors/utils — Tests
// ============================================================

import { describe, it, expect } from "vitest";
import {
  parseIntentId,
  toIntentId,
  isValidIntentId,
  tokenPathToCssVar,
  resolveTokenPath,
  generateAtomicClass,
  simpleHash,
  camelToKebab,
  deepMerge,
} from "./index";

describe("parseIntentId", () => {
  it("parses a three-segment intent", () => {
    const result = parseIntentId("card.elevated.interactive");
    expect(result.category).toBe("card");
    expect(result.variant).toBe("elevated");
    expect(result.modifier).toBe("interactive");
    expect(result.raw).toBe("card.elevated.interactive");
  });

  it("parses a two-segment intent", () => {
    const result = parseIntentId("button.primary");
    expect(result.category).toBe("button");
    expect(result.variant).toBe("primary");
    expect(result.modifier).toBeUndefined();
  });

  it("parses a single-segment intent", () => {
    const result = parseIntentId("nav");
    expect(result.category).toBe("nav");
    expect(result.variant).toBeUndefined();
  });
});

describe("isValidIntentId", () => {
  it("accepts valid dot-notation identifiers", () => {
    expect(isValidIntentId("card.elevated.interactive")).toBe(true);
    expect(isValidIntentId("button.primary")).toBe(true);
    expect(isValidIntentId("nav")).toBe(true);
    expect(isValidIntentId("alert.success")).toBe(true);
  });

  it("rejects identifiers starting with uppercase", () => {
    expect(isValidIntentId("Card.elevated")).toBe(false);
  });

  it("rejects empty string", () => {
    expect(isValidIntentId("")).toBe(false);
  });

  it("rejects identifiers with spaces", () => {
    expect(isValidIntentId("card elevated")).toBe(false);
  });
});

describe("tokenPathToCssVar", () => {
  it("converts token paths to CSS custom property names", () => {
    expect(tokenPathToCssVar("token.space.4")).toBe("--mastors-space-4");
    expect(tokenPathToCssVar("token.shadow.elevated")).toBe("--mastors-shadow-elevated");
    expect(tokenPathToCssVar("token.color.primary.500")).toBe("--mastors-color-primary-500");
  });
});

describe("resolveTokenPath", () => {
  const tokens = {
    token: {
      space: { "4": "1rem" },
      color: { primary: { "500": "#3b82f6" } },
    },
  };

  it("resolves a nested path", () => {
    expect(resolveTokenPath("token.space.4", tokens)).toBe("1rem");
    expect(resolveTokenPath("token.color.primary.500", tokens)).toBe("#3b82f6");
  });

  it("returns undefined for a missing path", () => {
    expect(resolveTokenPath("token.space.999", tokens)).toBeUndefined();
  });
});

describe("generateAtomicClass", () => {
  it("generates a stable, prefixed class name", () => {
    const cls = generateAtomicClass("padding-left", "1rem");
    expect(cls).toMatch(/^m-padding-left-/);
  });

  it("generates identical names for identical inputs", () => {
    const a = generateAtomicClass("background-color", "#fff");
    const b = generateAtomicClass("background-color", "#fff");
    expect(a).toBe(b);
  });

  it("generates different names for different values", () => {
    const a = generateAtomicClass("color", "#000");
    const b = generateAtomicClass("color", "#fff");
    expect(a).not.toBe(b);
  });
});

describe("camelToKebab", () => {
  it("converts camelCase to kebab-case", () => {
    expect(camelToKebab("backgroundColor")).toBe("background-color");
    expect(camelToKebab("paddingLeft")).toBe("padding-left");
    expect(camelToKebab("fontSize")).toBe("font-size");
    expect(camelToKebab("borderRadius")).toBe("border-radius");
  });

  it("leaves lowercase strings unchanged", () => {
    expect(camelToKebab("color")).toBe("color");
  });
});

describe("deepMerge", () => {
  it("merges two flat objects", () => {
    const result = deepMerge({ a: 1, b: 2 }, { b: 3, c: 4 });
    expect(result).toEqual({ a: 1, b: 3, c: 4 });
  });

  it("deep-merges nested objects", () => {
    const result = deepMerge(
      { a: { x: 1, y: 2 } },
      { a: { y: 99 } }
    );
    expect(result).toEqual({ a: { x: 1, y: 99 } });
  });

  it("does not mutate the original target", () => {
    const target = { a: 1 };
    deepMerge(target, { b: 2 } as never);
    expect(target).toEqual({ a: 1 });
  });
});
