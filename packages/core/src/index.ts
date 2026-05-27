// ============================================================
// @mastors/core — Semantic Resolver Engine
// Mastors Intent-Based Styling Framework v0.1.0
//
// Layer 2: The core intelligence — maps intent identifiers to
// resolved style descriptors via the Semantic Resolver.
// ============================================================

import type {
  IntentId,
  IntentDescriptor,
  IntentContext,
  IntentSegments,
  ResolvedStyleMap,
  StyleRule,
  A11yHint,
  AnimationRule,
  MastorsSchema,
  VocabularyEntry,
} from "@mastors/types";
import { parseIntentId, toIntentId, isValidIntentId, tokenPathToCssVar } from "@mastors/utils";
import { TokenRegistry, defaultTokens } from "@mastors/tokens";
import { defaultSchema } from "@mastors/schemas";

// ── Resolver Cache ───────────────────────────────────────────

type CacheKey = string;
const resolverCache = new Map<CacheKey, ResolvedStyleMap>();

function makeCacheKey(id: IntentId, context: IntentContext): CacheKey {
  return `${id}|${context.theme ?? "default"}|${context.viewport ?? "auto"}|${context.density ?? "comfortable"}`;
}

// ── Intent Lookup ────────────────────────────────────────────

/**
 * Find the best matching vocabulary entry for an intent ID.
 * Walks from most-specific (full match) to least-specific (category only).
 */
function findVocabularyEntry(
  id: IntentId,
  vocabulary: Record<string, VocabularyEntry>
): VocabularyEntry | undefined {
  // Try exact match first
  if (vocabulary[id]) return vocabulary[id];

  // Walk up the specificity chain
  const parts = id.split(".");
  for (let i = parts.length - 1; i > 0; i--) {
    const partial = parts.slice(0, i).join(".");
    if (vocabulary[partial]) return vocabulary[partial];
  }
  return undefined;
}

// ── Style Rule Builders ──────────────────────────────────────

function buildSpacingRules(entry: VocabularyEntry): StyleRule[] {
  const rules: StyleRule[] = [];
  if (entry.spacing?.x) {
    rules.push({
      property: "padding-left",
      value: `var(${tokenPathToCssVar(entry.spacing.x)})`,
      tokenRef: entry.spacing.x,
    });
    rules.push({
      property: "padding-right",
      value: `var(${tokenPathToCssVar(entry.spacing.x)})`,
      tokenRef: entry.spacing.x,
    });
  }
  if (entry.spacing?.y) {
    rules.push({
      property: "padding-top",
      value: `var(${tokenPathToCssVar(entry.spacing.y)})`,
      tokenRef: entry.spacing.y,
    });
    rules.push({
      property: "padding-bottom",
      value: `var(${tokenPathToCssVar(entry.spacing.y)})`,
      tokenRef: entry.spacing.y,
    });
  }
  return rules;
}

function buildColorRules(entry: VocabularyEntry): StyleRule[] {
  const rules: StyleRule[] = [];
  if (entry.color?.background) {
    rules.push({
      property: "background-color",
      value: `var(${tokenPathToCssVar(entry.color.background)})`,
      tokenRef: entry.color.background,
    });
  }
  if (entry.color?.foreground) {
    rules.push({
      property: "color",
      value: `var(${tokenPathToCssVar(entry.color.foreground)})`,
      tokenRef: entry.color.foreground,
    });
  }
  if (entry.color?.border) {
    rules.push({
      property: "border-color",
      value: `var(${tokenPathToCssVar(entry.color.border)})`,
      tokenRef: entry.color.border,
    });
    rules.push({ property: "border-width", value: "1px" });
    rules.push({ property: "border-style", value: "solid" });
  }
  return rules;
}

function buildTypographyRules(entry: VocabularyEntry): StyleRule[] {
  const rules: StyleRule[] = [];
  if (entry.typography?.size) {
    rules.push({
      property: "font-size",
      value: `var(${tokenPathToCssVar(entry.typography.size)})`,
      tokenRef: entry.typography.size,
    });
  }
  if (entry.typography?.weight) {
    rules.push({
      property: "font-weight",
      value: `var(${tokenPathToCssVar(entry.typography.weight)})`,
      tokenRef: entry.typography.weight,
    });
  }
  if (entry.typography?.lineHeight) {
    rules.push({
      property: "line-height",
      value: `var(${tokenPathToCssVar(entry.typography.lineHeight)})`,
      tokenRef: entry.typography.lineHeight,
    });
  }
  return rules;
}

function buildShadowRule(entry: VocabularyEntry): StyleRule[] {
  if (!entry.shadow) return [];
  return [{
    property: "box-shadow",
    value: `var(${tokenPathToCssVar(entry.shadow)})`,
    tokenRef: entry.shadow,
  }];
}

function buildRadiusRule(entry: VocabularyEntry): StyleRule[] {
  if (!entry.radius) return [];
  return [{
    property: "border-radius",
    value: `var(${tokenPathToCssVar(entry.radius)})`,
    tokenRef: entry.radius,
  }];
}

// ── A11y Hints Builder ───────────────────────────────────────

function buildA11yHints(entry: VocabularyEntry): A11yHint[] {
  const hints: A11yHint[] = [];
  if (entry.a11y?.role) {
    hints.push({
      type: "aria",
      requirement: `Set role="${entry.a11y.role}" on this element`,
      severity: "info",
    });
  }
  if (entry.a11y?.contrast) {
    hints.push({
      type: "contrast",
      requirement: `Must meet WCAG ${entry.a11y.contrast} contrast ratio`,
      severity: "warning",
    });
  }
  if (entry.interaction?.focus) {
    hints.push({
      type: "focus",
      requirement: `Interactive element must have visible focus indicator`,
      severity: "error",
    });
  }
  return hints;
}

// ── Animation Rules Builder ──────────────────────────────────

function buildAnimationRules(entry: VocabularyEntry): AnimationRule[] {
  if (!entry.motion) return [];
  if (entry.motion === "transition.natural") {
    return [{
      property: "all",
      duration: "var(--mastors-duration-normal, 200ms)",
      easing: "var(--mastors-easing-natural, cubic-bezier(0.4,0,0.2,1))" as AnimationRule["easing"],
    }];
  }
  return [];
}

// ── Semantic Resolver ────────────────────────────────────────

export class SemanticResolver {
  private schema: MastorsSchema;
  private tokenRegistry: TokenRegistry;

  constructor(schema: MastorsSchema = defaultSchema) {
    this.schema = schema;
    this.tokenRegistry = new TokenRegistry(defaultTokens);
  }

  /**
   * Resolve an intent identifier string into a full IntentDescriptor.
   */
  describe(raw: string, context: IntentContext = {}): IntentDescriptor {
    if (!isValidIntentId(raw)) {
      throw new Error(`Mastors: Invalid intent identifier "${raw}". Use dot-notation: "category.variant.modifier"`);
    }
    const segments: IntentSegments = parseIntentId(raw);
    return {
      id: toIntentId(raw),
      segments,
      context,
      __mastors: true,
    };
  }

  /**
   * Resolve an IntentDescriptor into a complete ResolvedStyleMap.
   * Results are cached for performance.
   */
  resolve(descriptor: IntentDescriptor): ResolvedStyleMap {
    const cacheKey = makeCacheKey(descriptor.id, descriptor.context);
    const cached = resolverCache.get(cacheKey);
    if (cached) return cached;

    const entry = findVocabularyEntry(descriptor.id, this.schema.vocabulary);

    if (!entry) {
      // Return a passthrough with a warning hint if no vocabulary entry found
      const fallback: ResolvedStyleMap = {
        intentId: descriptor.id,
        base: [],
        variants: [],
        a11yHints: [{
          type: "aria",
          requirement: `No vocabulary entry found for intent "${descriptor.id}"`,
          severity: "warning",
        }],
        animationRules: [],
      };
      resolverCache.set(cacheKey, fallback);
      return fallback;
    }

    // Run plugins first (if any)
    let pluginOverride: Partial<ResolvedStyleMap> | null = null;
    for (const plugin of this.schema.plugins ?? []) {
      const result = plugin.onResolve?.(descriptor);
      if (result) {
        pluginOverride = result;
        break;
      }
    }

    const base: StyleRule[] = [
      ...buildSpacingRules(entry),
      ...buildColorRules(entry),
      ...buildTypographyRules(entry),
      ...buildShadowRule(entry),
      ...buildRadiusRule(entry),
    ];

    const resolved: ResolvedStyleMap = {
      intentId: descriptor.id,
      base: pluginOverride?.base ?? base,
      variants: pluginOverride?.variants ?? [],
      a11yHints: pluginOverride?.a11yHints ?? buildA11yHints(entry),
      animationRules: pluginOverride?.animationRules ?? buildAnimationRules(entry),
    };

    resolverCache.set(cacheKey, resolved);
    return resolved;
  }

  /**
   * Clear the resolver cache (call when schema or tokens change).
   */
  clearCache(): void {
    resolverCache.clear();
  }

  /**
   * Update the schema (triggers a cache clear).
   */
  setSchema(schema: MastorsSchema): void {
    this.schema = schema;
    this.clearCache();
  }
}

// ── Default Resolver Singleton ───────────────────────────────

export const defaultResolver = new SemanticResolver(defaultSchema);
