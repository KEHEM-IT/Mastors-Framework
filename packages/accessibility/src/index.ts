// ============================================================
// @mastors/accessibility — WCAG 2.2 Accessibility Guard Layer
// Mastors Intent-Based Styling Framework v0.1.0
// ============================================================

import type {
  A11yHint,
  A11yManifest,
  A11yViolation,
  IntentId,
  ResolvedStyleMap,
  WCAGLevel,
} from "@mastors/types";
import type { TokenRegistry } from "@mastors/tokens";

// ── Contrast Ratio Calculator ─────────────────────────────────

/**
 * Parse a hex color string to linear RGB components [0–1].
 */
function hexToLinearRGB(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  const linearize = (c: number) =>
    c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  return [linearize(r), linearize(g), linearize(b)];
}

/**
 * Calculate relative luminance from linear RGB.
 * Per WCAG 2.2 definition.
 */
function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToLinearRGB(hex);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * Calculate the WCAG contrast ratio between two hex colors.
 * Returns a value between 1 (no contrast) and 21 (maximum contrast).
 */
export function contrastRatio(colorA: string, colorB: string): number {
  const lumA = relativeLuminance(colorA);
  const lumB = relativeLuminance(colorB);
  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Required minimum contrast ratios per WCAG level.
 */
export const WCAG_RATIOS: Record<WCAGLevel, { normal: number; large: number }> = {
  A: { normal: 3.0, large: 3.0 },
  AA: { normal: 4.5, large: 3.0 },
  AAA: { normal: 7.0, large: 4.5 },
};

/**
 * Check if a foreground/background pair meets a WCAG level requirement.
 */
export function meetsContrastRequirement(
  foreground: string,
  background: string,
  level: WCAGLevel,
  isLargeText = false
): boolean {
  const ratio = contrastRatio(foreground, background);
  const required = isLargeText
    ? WCAG_RATIOS[level].large
    : WCAG_RATIOS[level].normal;
  return ratio >= required;
}

// ── Focus Ring Generator ─────────────────────────────────────

/**
 * Generate WCAG-compliant focus ring CSS rules.
 */
export function generateFocusRing(variant: "primary" | "error" | "warning" = "primary"): string {
  const outlineColors: Record<string, string> = {
    primary: "var(--mastors-color-primary-500, #3b82f6)",
    error: "var(--mastors-color-error-500, #ef4444)",
    warning: "var(--mastors-color-warning-500, #eab308)",
  };
  const color = outlineColors[variant] ?? outlineColors["primary"];
  return [
    `outline: 2px solid ${color}`,
    `outline-offset: 2px`,
  ].join(";\n  ");
}

// ── ARIA Recommendations ─────────────────────────────────────

const ROLE_ARIA_MAP: Record<string, readonly string[]> = {
  article: ["aria-label"],
  navigation: ["aria-label"],
  dialog: ["aria-labelledby", "aria-describedby"],
  alert: [],
  status: [],
  button: ["aria-pressed", "aria-disabled"],
  form: ["aria-label"],
};

/**
 * Generate ARIA attribute recommendations for a given role.
 */
export function ariaRecommendations(role: string): A11yHint[] {
  const attrs = ROLE_ARIA_MAP[role] ?? [];
  return attrs.map((attr) => ({
    type: "aria" as const,
    requirement: `Add ${attr} to elements with role="${role}"`,
    severity: "info" as const,
  }));
}

// ── Accessibility Guard ──────────────────────────────────────

export type A11yGuardMode = "warn" | "enforce" | "report" | "off";

export class AccessibilityGuard {
  private mode: A11yGuardMode;
  private tokenRegistry: TokenRegistry;
  private violations: A11yViolation[] = [];

  constructor(mode: A11yGuardMode, tokenRegistry: TokenRegistry) {
    this.mode = mode;
    this.tokenRegistry = tokenRegistry;
  }

  /**
   * Run accessibility checks on a resolved style map.
   * Returns the violations found.
   */
  check(intentId: IntentId, styleMap: ResolvedStyleMap): readonly A11yViolation[] {
    const found: A11yViolation[] = [];

    for (const hint of styleMap.a11yHints) {
      // Escalate info-level hints in enforce mode
      if (this.mode === "enforce" && hint.severity === "info") {
        found.push({ ...hint, intentId });
      } else if (hint.severity === "error" || hint.severity === "warning") {
        found.push({ ...hint, intentId });
      }
    }

    this.violations.push(...found);

    if (this.mode === "enforce") {
      const errors = found.filter((v) => v.severity === "error");
      if (errors.length > 0) {
        const messages = errors.map((e) => `[${e.intentId}] ${e.requirement}`).join("\n");
        throw new Error(`Mastors: Accessibility violations in enforce mode:\n${messages}`);
      }
    } else if (this.mode === "warn") {
      for (const v of found) {
        console.warn(`[Mastors A11y] ${v.intentId}: ${v.requirement}`);
      }
    }

    return found;
  }

  /**
   * Generate a full accessibility manifest for the build.
   */
  generateManifest(totalIntents: number): A11yManifest {
    const failCount = this.violations.filter((v) => v.severity === "error").length;
    return {
      generatedAt: new Date().toISOString(),
      totalIntents,
      violations: this.violations,
      passCount: totalIntents - failCount,
      failCount,
    };
  }

  /**
   * Reset violation history (call between builds).
   */
  reset(): void {
    this.violations = [];
  }
}
