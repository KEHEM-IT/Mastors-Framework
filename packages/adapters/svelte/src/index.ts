// ============================================================
// @mastors/adapter-svelte — Svelte Adapter
// Mastors Intent-Based Styling Framework v0.1.0
//
// Provides intent() Svelte action and resolveIntent() helper
// for use in Svelte 4+ applications.
// ============================================================

import { intentClass } from "@mastors/api";
import type { IntentContext } from "@mastors/types";

// ── resolveIntent() ──────────────────────────────────────────

/**
 * Resolve an intent identifier to a CSS class string.
 * Use directly in Svelte template class bindings.
 *
 * @example
 * <script>
 *   import { resolveIntent } from "@mastors/adapter-svelte";
 *   const cardClass = resolveIntent("card.elevated.interactive");
 * </script>
 * <div class={cardClass}>...</div>
 */
export function resolveIntent(raw: string, context: IntentContext = {}): string {
  try {
    return intentClass(raw, context);
  } catch {
    return `m-intent-${raw.replace(/\./g, "-")}`;
  }
}

// ── intent Svelte Action ─────────────────────────────────────

/**
 * Svelte action that applies Mastors intent classes to a DOM element.
 *
 * @example
 * <script>
 *   import { intentAction } from "@mastors/adapter-svelte";
 * </script>
 * <div use:intentAction={"card.elevated.interactive"}>...</div>
 */
export function intentAction(
  node: HTMLElement,
  raw: string
): { update(newRaw: string): void; destroy(): void } {
  let currentClasses: string[] = [];

  function apply(intentId: string) {
    // Remove previous classes
    if (currentClasses.length > 0) {
      node.classList.remove(...currentClasses);
    }
    // Apply new classes
    try {
      currentClasses = intentClass(intentId).split(" ").filter(Boolean);
    } catch {
      currentClasses = [`m-intent-${intentId.replace(/\./g, "-")}`];
    }
    node.classList.add(...currentClasses);
  }

  apply(raw);

  return {
    update(newRaw: string) {
      apply(newRaw);
    },
    destroy() {
      if (currentClasses.length > 0) {
        node.classList.remove(...currentClasses);
      }
    },
  };
}

export type { IntentContext };
