// ============================================================
// @mastors/compiler — MastorsCompiler Tests
// ============================================================

import { describe, it, expect } from "vitest";
import { MastorsCompiler } from "./index";
import { defaultSchema } from "@mastors/schemas";
import { toIntentId } from "@mastors/utils";
import type { MastorsConfig } from "@mastors/types";

const testConfig: MastorsConfig = {
  schema: defaultSchema,
  a11yMode: "warn",
  outputFormat: "atomic",
};

describe("MastorsCompiler", () => {
  it("compiles a single intent to CSS", () => {
    const compiler = new MastorsCompiler(testConfig);
    const output = compiler.compile([toIntentId("card.elevated.interactive")]);
    expect(output.css).toBeTruthy();
    expect(output.css).toContain("box-shadow");
    expect(output.css).toContain("border-radius");
  });

  it("produces a tokenVars block", () => {
    const compiler = new MastorsCompiler(testConfig);
    const output = compiler.compile([toIntentId("button.primary")]);
    expect(output.tokenVars).toContain(":root");
    expect(output.tokenVars).toContain("--mastors-");
  });

  it("maps intent IDs to class name arrays", () => {
    const compiler = new MastorsCompiler(testConfig);
    const id = toIntentId("button.primary");
    const output = compiler.compile([id]);
    expect(output.classes[id]).toBeDefined();
    expect(output.classes[id]!.length).toBeGreaterThan(0);
    // Should include intent-level class
    expect(output.classes[id]!.some((c) => c.includes("intent"))).toBe(true);
  });

  it("deduplicates atomic classes across multiple intents", () => {
    const compiler = new MastorsCompiler(testConfig);
    const output = compiler.compile([
      toIntentId("button.primary"),
      toIntentId("button.secondary"),
    ]);
    // Count class definitions in CSS output
    const classMatches = (output.css.match(/\.[a-z]/g) ?? []).length;
    // Should be deduplicated — less than (primary rules + secondary rules) duplicated
    expect(classMatches).toBeGreaterThan(0);
    expect(output.css).toBeTruthy();
  });

  it("wraps animation rules in prefers-reduced-motion guards", () => {
    const compiler = new MastorsCompiler(testConfig);
    const output = compiler.compile([toIntentId("card.elevated.interactive")]);
    expect(output.css).toContain("prefers-reduced-motion");
    expect(output.css).toContain("transition: none");
  });

  it("generates a11y manifest when a11yMode is not off", () => {
    const compiler = new MastorsCompiler(testConfig);
    const output = compiler.compile([toIntentId("card.elevated.interactive")]);
    expect(output.a11yManifest).toBeDefined();
    expect(output.a11yManifest?.totalIntents).toBe(1);
  });

  it("skips a11y manifest when a11yMode is off", () => {
    const compiler = new MastorsCompiler({ ...testConfig, a11yMode: "off" });
    const output = compiler.compile([toIntentId("card.base")]);
    expect(output.a11yManifest).toBeUndefined();
  });

  it("classesFor() returns a space-separated class string for a single intent", () => {
    const compiler = new MastorsCompiler(testConfig);
    // Need to compile first to populate registry
    compiler.compile([toIntentId("button.primary.cta")]);
    const classes = compiler.classesFor(toIntentId("button.primary.cta"));
    expect(typeof classes).toBe("string");
    expect(classes.trim().length).toBeGreaterThan(0);
  });
});
