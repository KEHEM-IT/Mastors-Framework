// ============================================================
// @mastors/types — Core TypeScript Definitions
// Mastors Intent-Based Styling Framework v0.1.0
// ============================================================

// ── Intent Identifier ───────────────────────────────────────

/**
 * A dot-notation semantic identifier, e.g. "card.elevated.interactive"
 * Format: category[.variant[.modifier]]
 */
export type IntentId = string & { readonly __brand: "IntentId" };

export type IntentSegments = {
  readonly category: string;
  readonly variant?: string;
  readonly modifier?: string;
  readonly raw: string;
};

// ── Design Tokens ───────────────────────────────────────────

export type TokenValue = string | number;
export type TokenPath = string; // e.g. "token.space.4", "token.shadow.elevated"

export type TokenMap = {
  readonly [key: string]: TokenValue | TokenMap;
};

export type ResolvedTokenValue = {
  readonly cssVar: string;       // e.g. "--mastors-space-4"
  readonly fallback: TokenValue; // e.g. "1rem"
};

// ── Style Descriptors ────────────────────────────────────────

export type CSSPropertyValue = string | number;

export type StyleRule = {
  readonly property: string;
  readonly value: CSSPropertyValue;
  readonly tokenRef?: TokenPath;
};

export type StyleVariant = {
  readonly condition: StyleCondition;
  readonly rules: readonly StyleRule[];
};

export type StyleCondition =
  | { type: "media"; query: string }
  | { type: "container"; query: string }
  | { type: "pseudo"; selector: string }
  | { type: "theme"; name: string }
  | { type: "motion"; preference: "reduce" | "no-preference" };

// ── Intent Descriptor ────────────────────────────────────────

export type IntentContext = {
  readonly parentIntent?: IntentId;
  readonly theme?: string;
  readonly viewport?: "mobile" | "tablet" | "desktop";
  readonly density?: "compact" | "comfortable" | "spacious";
};

export type IntentDescriptor = {
  readonly id: IntentId;
  readonly segments: IntentSegments;
  readonly context: IntentContext;
  readonly __mastors: true;
};

// ── Resolved Style Maps ──────────────────────────────────────

export type ResolvedStyleMap = {
  readonly intentId: IntentId;
  readonly base: readonly StyleRule[];
  readonly variants: readonly StyleVariant[];
  readonly a11yHints: readonly A11yHint[];
  readonly animationRules: readonly AnimationRule[];
};

export type AdaptedStyleMap = ResolvedStyleMap & {
  readonly responsive: readonly StyleVariant[];
  readonly themes: Readonly<Record<string, readonly StyleRule[]>>;
  readonly motionVariants: Readonly<{
    standard: readonly AnimationRule[];
    reduced: readonly AnimationRule[];
  }>;
};

// ── Accessibility ────────────────────────────────────────────

export type WCAGLevel = "A" | "AA" | "AAA";

export type A11yHint = {
  readonly type: "contrast" | "focus" | "aria" | "motion" | "touch-target";
  readonly requirement: string;
  readonly severity: "error" | "warning" | "info";
};

export type A11yViolation = A11yHint & {
  readonly intentId: IntentId;
  readonly actual?: string;
  readonly expected?: string;
};

export type A11yManifest = {
  readonly generatedAt: string;
  readonly totalIntents: number;
  readonly violations: readonly A11yViolation[];
  readonly passCount: number;
  readonly failCount: number;
};

// ── Animation ────────────────────────────────────────────────

export type AnimationEasing =
  | "linear" | "ease" | "ease-in" | "ease-out" | "ease-in-out"
  | "spring" | `cubic-bezier(${string})`;

export type AnimationRule = {
  readonly property: string;
  readonly duration: string;
  readonly easing: AnimationEasing;
  readonly delay?: string;
  readonly fillMode?: "none" | "forwards" | "backwards" | "both";
};

// ── Schema ───────────────────────────────────────────────────

export type VocabularyEntry = {
  readonly spacing?: { x?: TokenPath; y?: TokenPath };
  readonly shadow?: TokenPath;
  readonly radius?: TokenPath;
  readonly color?: { background?: TokenPath; foreground?: TokenPath; border?: TokenPath };
  readonly interaction?: { hover?: string; focus?: string; active?: string };
  readonly motion?: string;
  readonly a11y?: { role?: string; contrast?: WCAGLevel; ariaLabel?: string };
  readonly typography?: { size?: TokenPath; weight?: TokenPath; lineHeight?: TokenPath };
};

export type MastorsSchema = {
  readonly tokens: string;
  readonly vocabulary: Readonly<Record<string, VocabularyEntry>>;
  readonly themes?: Readonly<Record<string, Partial<TokenMap>>>;
  readonly plugins?: readonly MastorsPlugin[];
};

// ── Plugin API ───────────────────────────────────────────────

export type MastorsPlugin = {
  readonly name: string;
  onResolve?: (descriptor: IntentDescriptor) => Partial<ResolvedStyleMap> | null;
  onCompile?: (styleMap: AdaptedStyleMap) => AdaptedStyleMap;
  onA11y?: (violations: readonly A11yViolation[]) => readonly A11yViolation[];
};

// ── Compiler Output ──────────────────────────────────────────

export type AtomicClass = {
  readonly className: string;
  readonly property: string;
  readonly value: CSSPropertyValue;
  readonly condition?: StyleCondition;
};

export type CompiledOutput = {
  readonly css: string;
  readonly classes: Readonly<Record<IntentId, readonly string[]>>;
  readonly a11yManifest?: A11yManifest;
  readonly tokenVars: string;
};

// ── Config ───────────────────────────────────────────────────

export type MastorsConfig = {
  readonly schema: MastorsSchema;
  readonly a11yMode?: "warn" | "enforce" | "report" | "off";
  readonly outputFormat?: "atomic" | "css-modules" | "css-vars";
  readonly themes?: readonly string[];
  readonly defaultTheme?: string;
};
