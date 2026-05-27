// ============================================================
// @mastors/adapter-react — React Adapter
// Mastors Intent-Based Styling Framework v0.1.0
//
// Provides useIntent() hook and <Mastors.div> JSX bindings
// for React 18+ (including RSC-compatible usage).
// ============================================================

import { useMemo, createElement, forwardRef } from "react";
import type { HTMLAttributes, ElementType, ForwardedRef, ReactNode } from "react";
import { intent, intentClass } from "@mastors/api";
import type { IntentContext, IntentDescriptor } from "@mastors/types";

// ── useIntent() Hook ─────────────────────────────────────────

/**
 * React hook that resolves an intent identifier to a CSS class string.
 * Memoized per intent + context for performance.
 *
 * @example
 * function Card() {
 *   const className = useIntent("card.elevated.interactive");
 *   return <div className={className}>...</div>;
 * }
 */
export function useIntent(raw: string, context: IntentContext = {}): string {
  return useMemo(() => {
    try {
      return intentClass(raw, context);
    } catch {
      // If compiler not configured, return intent class name only
      const id = raw.replace(/\./g, "-");
      return `m-intent-${id}`;
    }
  }, [raw, JSON.stringify(context)]);
}

/**
 * React hook that returns the full IntentDescriptor.
 * Useful for accessing resolved metadata (a11y hints, animation rules, etc.)
 *
 * @example
 * const descriptor = useIntentDescriptor("card.elevated.interactive");
 */
export function useIntentDescriptor(raw: string, context: IntentContext = {}): IntentDescriptor {
  return useMemo(() => intent(raw, context), [raw, JSON.stringify(context)]);
}

// ── MastorsComponent Props ───────────────────────────────────

export type MastorsProps<T extends ElementType = "div"> = {
  as?: T;
  intent: string;
  intentContext?: IntentContext;
  className?: string;
  children?: ReactNode;
} & Omit<HTMLAttributes<HTMLElement>, "className">;

// ── Mastors Component Factory ─────────────────────────────────

/**
 * Create a Mastors-powered component for any HTML element.
 *
 * @example
 * const Card = createMastorsComponent("div");
 * <Card intent="card.elevated.interactive">...</Card>
 */
export function createMastorsComponent<T extends keyof JSX.IntrinsicElements>(
  tag: T
) {
  const Component = forwardRef(function MastorsElement(
    { intent: intentId, intentContext, className, ...rest }: MastorsProps<T>,
    ref: ForwardedRef<HTMLElement>
  ) {
    const mastorsClass = useIntent(intentId, intentContext);
    const combined = [mastorsClass, className].filter(Boolean).join(" ");
    return createElement(tag, { ...rest, className: combined, ref });
  });
  Component.displayName = `Mastors.${tag}`;
  return Component;
}

// ── Mastors Namespace ────────────────────────────────────────

/**
 * Pre-built Mastors components for common HTML elements.
 *
 * @example
 * <Mastors.div intent="card.elevated.interactive">...</Mastors.div>
 * <Mastors.button intent="button.primary.cta">Submit</Mastors.button>
 * <Mastors.section intent="container.max.centered">...</Mastors.section>
 */
export const Mastors = {
  div: createMastorsComponent("div"),
  section: createMastorsComponent("section"),
  article: createMastorsComponent("article"),
  main: createMastorsComponent("main"),
  aside: createMastorsComponent("aside"),
  header: createMastorsComponent("header"),
  footer: createMastorsComponent("footer"),
  nav: createMastorsComponent("nav"),
  button: createMastorsComponent("button"),
  a: createMastorsComponent("a"),
  p: createMastorsComponent("p"),
  h1: createMastorsComponent("h1"),
  h2: createMastorsComponent("h2"),
  h3: createMastorsComponent("h3"),
  span: createMastorsComponent("span"),
  ul: createMastorsComponent("ul"),
  li: createMastorsComponent("li"),
  form: createMastorsComponent("form"),
  input: createMastorsComponent("input"),
  label: createMastorsComponent("label"),
};

export type { IntentContext, IntentDescriptor };
