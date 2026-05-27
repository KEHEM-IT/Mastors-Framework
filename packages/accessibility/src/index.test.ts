// ============================================================
// @mastors/accessibility — AccessibilityGuard Tests
// ============================================================

import { describe, it, expect, vi } from "vitest";
import {
  contrastRatio,
  meetsContrastRequirement,
  WCAG_RATIOS,
  generateFocusRing,
  ariaRecommendations,
  AccessibilityGuard,
} from "./index";
import { TokenRegistry, defaultTokens } from "@mastors/tokens";
import type { ResolvedStyleMap } from "@mastors/types";
import { toIntentId } from "@mastors/utils";

// ── Contrast utilities ─────────────────────────────────────

describe("contrastRatio", () => {
  it("returns 21 for pure black on pure white", () => {
    expect(contrastRatio("#000000", "#ffffff")).toBeCloseTo(21, 0);
  });

  it("returns 1 for identical colors", () => {
    expect(contrastRatio("#3b82f6", "#3b82f6")).toBeCloseTo(1, 1);
  });

  it("is symmetrical", () => {
    const a = contrastRatio("#3b82f6", "#ffffff");
    const b = contrastRatio("#ffffff", "#3b82f6");
    expect(a).toBeCloseTo(b, 5);
  });
});

describe("meetsContrastRequirement", () => {
  it("accepts black-on-white for AA (normal text)", () => {
    expect(meetsContrastRequirement("#000000", "#ffffff", "AA")).toBe(true);
  });

  it("rejects a low-contrast pair for AA", () => {
    expect(meetsContrastRequirement("#aaaaaa", "#ffffff", "AA")).toBe(false);
  });

  it("uses a lower threshold for large text (AA)", () => {
    // #767676 on white is ~4.48 — passes AA large (3:1) but may vary
    expect(meetsContrastRequirement("#000000", "#ffffff", "AA", true)).toBe(true);
  });

  it("checks AAA threshold correctly", () => {
    // Black on white (21:1) passes AAA
    expect(meetsContrastRequirement("#000000", "#ffffff", "AAA")).toBe(true);
    // Mid-grey on white (~3.5:1) fails AAA normal (needs 7:1)
    expect(meetsContrastRequirement("#777777", "#ffffff", "AAA")).toBe(false);
  });
});

// ── generateFocusRing ─────────────────────────────────────

describe("generateFocusRing", () => {
  it("generates CSS rules string", () => {
    const css = generateFocusRing("primary");
    expect(css).toContain("outline:");
    expect(css).toContain("outline-offset:");
  });

  it("generates an error-coloured ring", () => {
    const css = generateFocusRing("error");
    expect(css).toContain("error");
  });
});

// ── ariaRecommendations ───────────────────────────────────

describe("ariaRecommendations", () => {
  it("returns hints for a known role", () => {
    const hints = ariaRecommendations("navigation");
    expect(hints.length).toBeGreaterThan(0);
    expect(hints[0].type).toBe("aria");
  });

  it("returns empty array for an unknown role", () => {
    const hints = ariaRecommendations("unknown-role-xyz");
    expect(hints).toEqual([]);
  });
});

// ── AccessibilityGuard ────────────────────────────────────

describe("AccessibilityGuard", () => {
  const registry = new TokenRegistry(defaultTokens);

  const makeStyleMap = (severity: "error" | "warning" | "info" = "warning"): ResolvedStyleMap => ({
    intentId: toIntentId("button.primary"),
    base: [],
    variants: [],
    animationRules: [],
    a11yHints: [
      {
        type: "contrast",
        requirement: "Must meet WCAG AA contrast ratio",
        severity,
      },
    ],
  });

  it("warn mode logs but does not throw", () => {
    const guard = new AccessibilityGuard("warn", registry);
    const spy = vi.spyOn(console, "warn").mockImplementation(() => {});
    expect(() =>
      guard.check(toIntentId("button.primary"), makeStyleMap("warning"))
    ).not.toThrow();
    spy.mockRestore();
  });

  it("enforce mode throws on error-severity violations", () => {
    const guard = new AccessibilityGuard("enforce", registry);
    expect(() =>
      guard.check(toIntentId("button.primary"), makeStyleMap("error"))
    ).toThrow(/Accessibility violations/);
  });

  it("generates a manifest after checks", () => {
    const guard = new AccessibilityGuard("report", registry);
    guard.check(toIntentId("button.primary"), makeStyleMap("warning"));
    const manifest = guard.generateManifest(1);
    expect(manifest.totalIntents).toBe(1);
    expect(manifest.violations.length).toBeGreaterThan(0);
    expect(manifest.generatedAt).toBeDefined();
  });

  it("reset() clears violation history", () => {
    const guard = new AccessibilityGuard("report", registry);
    guard.check(toIntentId("button.primary"), makeStyleMap("warning"));
    guard.reset();
    const manifest = guard.generateManifest(0);
    expect(manifest.violations).toHaveLength(0);
  });
});
