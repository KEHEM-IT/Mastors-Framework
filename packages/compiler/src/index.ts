// ============================================================
// @mastors/compiler — Zero-Runtime CSS Output Compiler
// Mastors Intent-Based Styling Framework v0.1.0
//
// Layer 5: Transforms resolved style maps into optimized,
// deduplicated atomic CSS output. Zero JavaScript at runtime.
// ============================================================

import type {
  IntentId,
  ResolvedStyleMap,
  AtomicClass,
  CompiledOutput,
  StyleRule,
  MastorsConfig,
} from "@mastors/types";
import { generateAtomicClass, camelToKebab } from "@mastors/utils";
import { TokenRegistry, defaultTokens } from "@mastors/tokens";
import { AccessibilityGuard } from "@mastors/accessibility";
import { SemanticResolver } from "@mastors/core";

// ── Adaptive Runtime ─────────────────────────────────────────
// (Layer 3 logic — responsive, theme, motion — is generated here)

function buildResponsiveVariants(styleMap: ResolvedStyleMap): string {
  if (styleMap.variants.length === 0) return "";
  const lines: string[] = [];
  for (const variant of styleMap.variants) {
    const c = variant.condition;
    if (c.type === "media") {
      const inner = variant.rules
        .map((r) => `  .${generateAtomicClass(r.property, String(r.value))} { ${camelToKebab(r.property)}: ${r.value}; }`)
        .join("\n");
      lines.push(`@media ${c.query} {\n${inner}\n}`);
    }
  }
  return lines.join("\n");
}

function buildMotionVariant(styleMap: ResolvedStyleMap): string {
  if (styleMap.animationRules.length === 0) return "";
  const transitionValue = styleMap.animationRules
    .map((r) => `${r.property} ${r.duration} ${r.easing}${r.delay ? ` ${r.delay}` : ""}`)
    .join(", ");

  const intentClass = `m-intent-${styleMap.intentId.replace(/\./g, "-")}`;
  const standard = `.${intentClass} { transition: ${transitionValue}; }`;
  const reduced = `@media (prefers-reduced-motion: reduce) { .${intentClass} { transition: none; } }`;
  return `${standard}\n${reduced}`;
}

// ── Atomic Class Deduplication ───────────────────────────────

class AtomicClassRegistry {
  private seen = new Map<string, AtomicClass>();

  register(rule: StyleRule): AtomicClass {
    const property = camelToKebab(rule.property);
    const className = generateAtomicClass(property, String(rule.value));
    if (!this.seen.has(className)) {
      this.seen.set(className, {
        className,
        property,
        value: rule.value,
      });
    }
    return this.seen.get(className)!;
  }

  generateCSS(): string {
    return [...this.seen.values()]
      .map(({ className, property, value }) => `.${className} { ${property}: ${value}; }`)
      .join("\n");
  }
}

// ── Compiler ─────────────────────────────────────────────────

export class MastorsCompiler {
  private config: MastorsConfig;
  private resolver: SemanticResolver;
  private tokenRegistry: TokenRegistry;
  private a11yGuard: AccessibilityGuard;
  private atomicRegistry: AtomicClassRegistry;

  constructor(config: MastorsConfig) {
    this.config = config;
    this.resolver = new SemanticResolver(config.schema);
    this.tokenRegistry = new TokenRegistry(defaultTokens);
    this.a11yGuard = new AccessibilityGuard(
      config.a11yMode ?? "warn",
      this.tokenRegistry
    );
    this.atomicRegistry = new AtomicClassRegistry();
  }

  /**
   * Compile a list of intent IDs into a full CSS output bundle.
   */
  compile(intentIds: IntentId[]): CompiledOutput {
    this.a11yGuard.reset();
    this.atomicRegistry = new AtomicClassRegistry();

    const classMap: Record<IntentId, string[]> = {};
    const extraCss: string[] = [];

    for (const id of intentIds) {
      const descriptor = this.resolver.describe(id);
      const styleMap = this.resolver.resolve(descriptor);

      // Run accessibility checks
      this.a11yGuard.check(id, styleMap);

      // Register atomic classes for base rules
      const classes: string[] = [];
      for (const rule of styleMap.base) {
        const atomic = this.atomicRegistry.register(rule);
        classes.push(atomic.className);
      }

      // Intent-level class for motion/interaction
      const intentClass = `m-intent-${id.replace(/\./g, "-")}`;
      classes.push(intentClass);

      classMap[id] = classes;

      // Responsive variants
      const responsiveCss = buildResponsiveVariants(styleMap);
      if (responsiveCss) extraCss.push(responsiveCss);

      // Motion declarations
      const motionCss = buildMotionVariant(styleMap);
      if (motionCss) extraCss.push(motionCss);
    }

    // Generate token CSS variables
    const tokenVars = this.tokenRegistry.generateCssVars(":root");

    // Combine all CSS
    const atomicCss = this.atomicRegistry.generateCSS();
    const css = [atomicCss, ...extraCss].filter(Boolean).join("\n\n");

    // Generate a11y manifest if needed
    const a11yManifest =
      this.config.a11yMode !== "off"
        ? this.a11yGuard.generateManifest(intentIds.length)
        : undefined;

    return {
      css,
      classes: classMap,
      tokenVars,
      a11yManifest,
    };
  }

  /**
   * Get the CSS class string for a single intent ID (for use in adapters).
   */
  classesFor(intentId: IntentId): string {
    const descriptor = this.resolver.describe(intentId);
    const styleMap = this.resolver.resolve(descriptor);
    const classes: string[] = [];
    for (const rule of styleMap.base) {
      const atomic = this.atomicRegistry.register(rule);
      classes.push(atomic.className);
    }
    classes.push(`m-intent-${intentId.replace(/\./g, "-")}`);
    return classes.join(" ");
  }
}
