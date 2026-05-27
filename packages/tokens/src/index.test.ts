// ============================================================
// @mastors/tokens — Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { TokenRegistry, defaultTokens } from "./index";

describe("TokenRegistry", () => {
  const registry = new TokenRegistry(defaultTokens);

  it("resolves a known token path", () => {
    expect(registry.resolve("token.space.4")).toBe("1rem");
    expect(registry.resolve("token.radius.lg")).toBe("0.5rem");
    expect(registry.resolve("token.shadow.elevated")).toBeDefined();
  });

  it("returns undefined for an unknown path", () => {
    expect(registry.resolve("token.space.999")).toBeUndefined();
  });

  it("resolves to a CSS var with fallback", () => {
    const result = registry.resolveToVar("token.space.4");
    expect(result.cssVar).toBe("--mastors-space-4");
    expect(result.fallback).toBe("1rem");
  });

  it("generates a :root CSS block containing custom properties", () => {
    const css = registry.generateCssVars(":root");
    expect(css).toMatch(/^:root \{/);
    expect(css).toContain("--mastors-space-4: 1rem");
    expect(css).toContain("--mastors-radius-lg: 0.5rem");
  });

  it("extends the registry with overrides", () => {
    const extended = registry.extend({
      token: {
        space: { "4": "0.875rem" }, // override
      },
    });
    expect(extended.resolve("token.space.4")).toBe("0.875rem");
    // Original unchanged
    expect(registry.resolve("token.space.4")).toBe("1rem");
  });
});
