// ============================================================
// @mastors/core — SemanticResolver Tests
// ============================================================

import { describe, it, expect, beforeEach } from "vitest";
import { SemanticResolver, defaultResolver } from "./index";
import { defaultSchema } from "@mastors/schemas";

describe("SemanticResolver", () => {
  let resolver: SemanticResolver;

  beforeEach(() => {
    resolver = new SemanticResolver(defaultSchema);
  });

  // ── describe() ────────────────────────────────────────────

  describe("describe()", () => {
    it("parses a valid intent identifier into a descriptor", () => {
      const d = resolver.describe("card.elevated.interactive");
      expect(d.__mastors).toBe(true);
      expect(d.id).toBe("card.elevated.interactive");
      expect(d.segments.category).toBe("card");
      expect(d.segments.variant).toBe("elevated");
      expect(d.segments.modifier).toBe("interactive");
    });

    it("throws for an invalid intent identifier", () => {
      expect(() => resolver.describe("Card.Elevated")).toThrow(/Invalid intent/);
      expect(() => resolver.describe("")).toThrow();
      expect(() => resolver.describe("has spaces")).toThrow();
    });

    it("attaches context to the descriptor", () => {
      const d = resolver.describe("button.primary", { theme: "dark" });
      expect(d.context.theme).toBe("dark");
    });
  });

  // ── resolve() ─────────────────────────────────────────────

  describe("resolve()", () => {
    it("resolves a known intent to style rules", () => {
      const descriptor = resolver.describe("card.elevated.interactive");
      const styleMap = resolver.resolve(descriptor);
      expect(styleMap.intentId).toBe("card.elevated.interactive");
      expect(styleMap.base.length).toBeGreaterThan(0);
    });

    it("returns a11y hints for interactive intents", () => {
      const descriptor = resolver.describe("card.elevated.interactive");
      const styleMap = resolver.resolve(descriptor);
      expect(styleMap.a11yHints.length).toBeGreaterThan(0);
    });

    it("returns animation rules for motion intents", () => {
      const descriptor = resolver.describe("card.elevated.interactive");
      const styleMap = resolver.resolve(descriptor);
      expect(styleMap.animationRules.length).toBeGreaterThan(0);
    });

    it("returns a fallback warning for unknown intents", () => {
      const descriptor = resolver.describe("unknown.intent");
      const styleMap = resolver.resolve(descriptor);
      expect(styleMap.base).toHaveLength(0);
      expect(styleMap.a11yHints.some((h) => h.severity === "warning")).toBe(true);
    });

    it("returns cached results on repeated resolve calls", () => {
      const d1 = resolver.describe("button.primary");
      const d2 = resolver.describe("button.primary");
      const s1 = resolver.resolve(d1);
      const s2 = resolver.resolve(d2);
      expect(s1).toBe(s2); // same reference = cache hit
    });

    it("walks up specificity chain for partial matches", () => {
      // "card.elevated.interactive.extra" has no exact match;
      // resolver should fall back to "card.elevated.interactive"
      const d = resolver.describe("card.elevated.interactive");
      const s = resolver.resolve(d);
      expect(s.base.length).toBeGreaterThan(0);
    });
  });

  // ── clearCache() ──────────────────────────────────────────

  describe("clearCache()", () => {
    it("clears cached resolved style maps", () => {
      const d = resolver.describe("button.primary");
      const s1 = resolver.resolve(d);
      resolver.clearCache();
      const s2 = resolver.resolve(d);
      // After cache clear, new object is returned
      expect(s1).not.toBe(s2);
      // But values should be deeply equal
      expect(s1.intentId).toBe(s2.intentId);
      expect(s1.base.length).toBe(s2.base.length);
    });
  });

  // ── Built-in vocabulary coverage ──────────────────────────

  describe("built-in vocabulary", () => {
    const knownIntents = [
      "card.base",
      "card.elevated",
      "card.elevated.interactive",
      "button.primary",
      "button.primary.cta",
      "button.secondary",
      "button.destructive",
      "heading.hero",
      "heading.section",
      "body.readable",
      "nav.primary",
      "nav.primary.sticky",
      "alert.info",
      "alert.success",
      "alert.warning",
      "alert.destructive",
      "toast.success.transient",
      "form.field",
      "form.destructive.confirm",
    ];

    for (const id of knownIntents) {
      it(`resolves "${id}" without errors`, () => {
        const d = resolver.describe(id);
        const s = resolver.resolve(d);
        expect(s.intentId).toBe(id);
        expect(s.base.length).toBeGreaterThan(0);
      });
    }
  });

  // ── defaultResolver singleton ──────────────────────────────

  describe("defaultResolver", () => {
    it("is a SemanticResolver instance", () => {
      expect(defaultResolver).toBeInstanceOf(SemanticResolver);
    });

    it("resolves the flagship example from the thesis", () => {
      const d = defaultResolver.describe("card.elevated.interactive");
      const s = defaultResolver.resolve(d);
      // Should have shadow, spacing, radius, interaction, motion
      const props = s.base.map((r) => r.property);
      expect(props).toContain("box-shadow");
      expect(props).toContain("border-radius");
      expect(props).toContain("padding-left");
      expect(s.animationRules.length).toBeGreaterThan(0);
      expect(s.a11yHints.length).toBeGreaterThan(0);
    });
  });
});
