// ============================================================
// @mastors/schemas — defineSchema & vocabulary Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { defineSchema, defaultSchema, builtinVocabulary } from "./index";

describe("defineSchema", () => {
  it("returns the schema object unchanged", () => {
    const schema = defineSchema({
      tokens: "./tokens.json",
      vocabulary: {
        "custom.intent": {
          spacing: { x: "token.space.4" },
        },
      },
    });
    expect(schema.tokens).toBe("./tokens.json");
    expect(schema.vocabulary["custom.intent"]).toBeDefined();
  });
});

describe("defaultSchema", () => {
  it("has a tokens reference", () => {
    expect(defaultSchema.tokens).toBeTruthy();
  });

  it("exports the built-in vocabulary", () => {
    expect(Object.keys(defaultSchema.vocabulary).length).toBeGreaterThan(10);
  });

  it("includes the thesis flagship example", () => {
    expect(defaultSchema.vocabulary["card.elevated.interactive"]).toBeDefined();
  });
});

describe("builtinVocabulary", () => {
  it("has spacing defined for card.elevated.interactive", () => {
    const entry = builtinVocabulary["card.elevated.interactive"];
    expect(entry.spacing?.x).toBeDefined();
    expect(entry.spacing?.y).toBeDefined();
  });

  it("has a11y defined for button.primary.cta (AAA level)", () => {
    const entry = builtinVocabulary["button.primary.cta"];
    expect(entry.a11y?.contrast).toBe("AAA");
  });

  it("has motion defined for interactive elements", () => {
    const interactive = [
      "card.elevated.interactive",
      "button.primary",
      "button.primary.cta",
      "button.secondary",
      "button.destructive",
    ];
    for (const id of interactive) {
      expect(builtinVocabulary[id]?.motion).toBeDefined();
    }
  });

  it("covers all thesis-documented categories", () => {
    const categories = Object.keys(builtinVocabulary).map((k) => k.split(".")[0]);
    const unique = new Set(categories);
    expect(unique.has("card")).toBe(true);
    expect(unique.has("button")).toBe(true);
    expect(unique.has("heading")).toBe(true);
    expect(unique.has("nav")).toBe(true);
    expect(unique.has("alert")).toBe(true);
    expect(unique.has("form")).toBe(true);
    expect(unique.has("toast")).toBe(true);
    expect(unique.has("container")).toBe(true);
  });
});
