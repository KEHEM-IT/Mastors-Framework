// ============================================================
// Mastors Playground — main.ts
// Imports each vocabulary category directly — no monolith JSON.
// ============================================================

import { SemanticResolver } from "@mastors/core";
import { defaultSchema }    from "@mastors/schemas";
import { defaultTokens }    from "@mastors/tokens";
import type { ResolvedStyleMap, StyleRule } from "@mastors/types";
import { camelToKebab as toKebab } from "@mastors/utils";

// ── Per-category imports (tree-shakeable) ─────────────────────
import cardsData      from "./data/vocabulary/cards.json";
import buttonsData    from "./data/vocabulary/buttons.json";
import typographyData from "./data/vocabulary/typography.json";
import alertsData     from "./data/vocabulary/alerts.json";
import navigationData from "./data/vocabulary/navigation.json";
import formsData      from "./data/vocabulary/forms.json";
import layoutData     from "./data/vocabulary/layout.json";

// ── Types ─────────────────────────────────────────────────────
interface TokenRef {
  property: string;
  token: string;
  description: string;
}
interface WcagCriterion {
  id: string;
  name: string;
  level: string;
}
interface IntentPreview {
  type: string;
  text?: string;
  title?: string;
  body?: string;
  tag?: string;
  icon?: string;
  variant?: string;
  label?: string;
  description?: string;
  logo?: string;
  links?: string[];
  cta?: string;
  sticky?: boolean;
  actions?: { label: string; variant: string }[];
  heading?: string;
  placeholder?: string;
  inputType?: string;
  helperText?: string;
  dismissible?: boolean;
}
interface MastorsDecl {
  declaration: string;
  config: string;
  description: string;
}
interface IntentEntry {
  id: string;
  label: string;
  shortLabel: string;
  description: string;
  semanticRole: string;
  htmlTag: string;
  ariaRole: string | null;
  ariaLandmark: boolean;
  status: string;
  since: string;
  mastors?: MastorsDecl;
  preview: IntentPreview;
  cssProperties: string[];
  tokenRefs: TokenRef[];
  a11y: {
    wcagLevel: string;
    wcagCriteria: WcagCriterion[];
    ariaAttributes: string[];
    focusable: boolean;
    notes: string[];
    hints: unknown[];
  };
  variants: string[];
  modifiers: string[];
  relatedIntents: string[];
}
interface VocabCategory {
  id: string;
  label: string;
  icon: string;
  description: string;
  intents: IntentEntry[];
}

// ── Assemble categories from individual files ─────────────────
const VOCAB_CATEGORIES: VocabCategory[] = [
  cardsData,
  buttonsData,
  typographyData,
  alertsData,
  navigationData,
  formsData,
  layoutData,
] as VocabCategory[];

const INTENT_MAP = new Map<string, IntentEntry>();
for (const cat of VOCAB_CATEGORIES) {
  for (const intent of cat.intents) {
    INTENT_MAP.set(intent.id, intent);
  }
}

// ── Resolver ─────────────────────────────────────────────────
const resolver = new SemanticResolver(defaultSchema);

// ── Token value lookup ────────────────────────────────────────
const TOKEN_VALUES: Record<string, string> = {};
(function flattenTokens(obj: Record<string, unknown>, prefix: string) {
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === "object" && v !== null) {
      flattenTokens(v as Record<string, unknown>, key);
    } else {
      TOKEN_VALUES[key] = String(v);
    }
  }
})(defaultTokens as unknown as Record<string, unknown>, "");

function resolveTokenValue(ref: string): string {
  return TOKEN_VALUES[ref] ?? ref;
}

// ── State ─────────────────────────────────────────────────────
let currentTheme: "light" | "dark" = "dark";
let currentTab: "css" | "rules" | "a11y" | "tokens" | "mastors" = "css";
let lastCSS = "";

// ── Token color helpers ───────────────────────────────────────
const COLOR_TOKEN_PREFIXES = ["token.color."];
function isColorToken(ref: string): boolean {
  return COLOR_TOKEN_PREFIXES.some((p) => ref.startsWith(p));
}

// ── Theme-aware token overrides ───────────────────────────────
// The schema uses static light-mode tokens (neutral.0 = white, etc.)
// This map swaps them to dark-mode equivalents in the preview only.
const DARK_TOKEN_OVERRIDES: Record<string, string> = {
  // ── Neutral scale ──────────────────────────────────────────
  "token.color.neutral.0":   "#1d2133",   // white  → dark card surface
  "token.color.neutral.50":  "#161929",   // gray50 → dark page bg
  "token.color.neutral.100": "#252840",   // gray100→ dark subtle surface
  "token.color.neutral.200": "#2e3350",   // gray200→ dark border
  "token.color.neutral.300": "#3d4166",   // gray300→ dark muted border
  // Text
  "token.color.neutral.800": "#e2e8f0",   // dark text → light text
  "token.color.neutral.700": "#94a3b8",   // body text → muted light
  "token.color.neutral.500": "#64748b",
  "token.color.neutral.400": "#475569",

  // ── Semantic surface tokens (card / nav / input) ───────────
  "token.color.surface.base":     "#1d2133",   // card, modal surface
  "token.color.surface.raised":   "#252840",   // elevated card surface
  "token.color.surface.overlay":  "#2e3350",   // overlay / dropdown
  "token.color.surface.nav":      "#111320",   // nav bar surface
  "token.color.surface.input":    "#111827",   // input background
  "token.color.surface.subtle":   "#161929",   // page / subtle surface

  // ── Semantic border tokens ─────────────────────────────────
  "token.color.border.subtle":    "#2e3350",   // subtle dividers / card borders
  "token.color.border.default":   "#3d4166",   // default border
  "token.color.border.strong":    "#4a5080",   // strong border
  "token.color.border.input":     "#374151",   // form input border
  "token.color.border.focus":     "#6366f1",   // focus ring border

  // ── Focus ring ─────────────────────────────────────────────
  "token.color.focus.ring":       "rgba(99,102,241,0.55)",

  // ── Primary scale ──────────────────────────────────────────
  "token.color.primary.50":       "rgba(59,130,246,0.12)",
  "token.color.primary.100":      "rgba(59,130,246,0.15)",
  "token.color.primary.200":      "rgba(59,130,246,0.3)",
  "token.color.primary.700":      "#93c5fd",

  // ── Semantic alert / status tokens (info) ─────────────────
  "token.color.info.surface":     "rgba(59,130,246,0.12)",
  "token.color.info.bg":          "rgba(59,130,246,0.12)",
  "token.color.info.text":        "#93c5fd",
  "token.color.info.border":      "rgba(59,130,246,0.4)",
  "token.color.info.accent":      "#3b82f6",

  // ── Semantic alert / status tokens (success) ──────────────
  "token.color.success.surface":  "rgba(34,197,94,0.12)",
  "token.color.success.bg":       "rgba(34,197,94,0.12)",
  "token.color.success.text":     "#86efac",
  "token.color.success.border":   "rgba(34,197,94,0.4)",
  "token.color.success.accent":   "#22c55e",
  "token.color.success.100":      "rgba(34,197,94,0.12)",
  "token.color.success.700":      "#86efac",

  // ── Semantic alert / status tokens (warning) ──────────────
  "token.color.warning.surface":  "rgba(234,179,8,0.12)",
  "token.color.warning.bg":       "rgba(234,179,8,0.12)",
  "token.color.warning.text":     "#fde047",
  "token.color.warning.border":   "rgba(234,179,8,0.4)",
  "token.color.warning.accent":   "#eab308",
  "token.color.warning.100":      "rgba(234,179,8,0.12)",
  "token.color.warning.700":      "#fde047",

  // ── Semantic alert / status tokens (error / destructive) ──
  "token.color.error.surface":    "rgba(239,68,68,0.12)",
  "token.color.error.bg":         "rgba(239,68,68,0.12)",
  "token.color.error.text":       "#fca5a5",
  "token.color.error.border":     "rgba(239,68,68,0.4)",
  "token.color.error.accent":     "#ef4444",
  "token.color.error.100":        "rgba(239,68,68,0.12)",
  "token.color.error.500":        "#ef4444",
  "token.color.error.700":        "#fca5a5",

  "token.color.destructive.surface": "rgba(239,68,68,0.12)",
  "token.color.destructive.bg":      "rgba(239,68,68,0.12)",
  "token.color.destructive.text":    "#fca5a5",
  "token.color.destructive.border":  "rgba(239,68,68,0.4)",
  "token.color.destructive.accent":  "#ef4444",
};

function resolveTokenForTheme(ref: string, isDark: boolean): string {
  if (isDark) {
    const override = DARK_TOKEN_OVERRIDES[ref];
    if (override) return override;
  }
  return resolveTokenValue(ref);
}

// ── Build preview element ─────────────────────────────────────
// Strategy: apply computedStyles FIRST, then theme-aware overrides LAST
// so light/dark switch always wins over resolved token values.
function buildPreviewEl(intentId: string, styleMap: ResolvedStyleMap): HTMLElement {
  const entry    = INTENT_MAP.get(intentId);
  const category = intentId.split(".")[0] ?? "";
  const variant  = intentId.split(".")[1] ?? "";
  const isDark   = currentTheme === "dark";
  const pv       = entry?.preview;

  // Non-color computed styles (layout, spacing, border-radius, etc.)
  // We split them so color props from tokens don't stomp our theme colors.
  const computedStyles: Record<string, string> = {};
  const COLOR_PROPS = new Set([
    "color","background","background-color",
    "border-color","border-top-color","border-right-color","border-bottom-color","border-left-color",
    "outline-color","box-shadow","text-decoration-color","caret-color",
  ]);
  const computedColors: Record<string, string> = {};
  for (const rule of styleMap.base) {
    const prop = toKebab(rule.property);
    // Use theme-aware resolver so dark mode gets dark surface colors
    const val  = rule.tokenRef ? resolveTokenForTheme(rule.tokenRef, isDark) : String(rule.value);
    if (COLOR_PROPS.has(prop)) {
      computedColors[prop] = val;
    } else {
      computedStyles[prop] = val;
    }
  }

  // Helper: only use a resolved color if it's a real CSS value (not an unresolved token path)
  const isValidColor = (v: string | undefined): v is string =>
    !!v && !v.startsWith("token.") && v !== "undefined";

  const textColor  = isDark ? "#e2e8f0" : "#1e293b";
  const mutedColor = isDark ? "#94a3b8" : "#64748b";
  const borderCol  = isDark ? "#374151" : "#d1d5db";
  const inputBg    = isDark ? "#111827" : "#ffffff";
  let el: HTMLElement;

  if (category === "button") {
    el = document.createElement("button");
    el.textContent = pv?.text ?? entry?.label ?? "Button";
    // Apply layout styles first, then token colors (buttons should keep their token colors)
    Object.assign(el.style, computedStyles);
    Object.assign(el.style, computedColors);
    el.style.cursor = "pointer";
    el.style.fontFamily = "Inter, sans-serif";
    el.style.fontWeight = "600";
    el.style.fontSize   = "0.9rem";
    el.style.letterSpacing = "-0.01em";
    return el;
  }

  if (category === "heading") {
    const tag = pv?.tag ?? (variant === "hero" ? "h1" : variant === "section" ? "h2" : "h3");
    el = document.createElement(tag);
    el.textContent = pv?.text ?? entry?.label ?? "Heading";
    Object.assign(el.style, computedStyles);
    // Theme color always wins for text
    el.style.color = textColor;
    el.style.fontFamily = "Inter, sans-serif";
    el.style.maxWidth = "520px";
    return el;
  }

  if (category === "body") {
    el = document.createElement("p");
    el.textContent = pv?.text ?? "Body text placeholder.";
    Object.assign(el.style, computedStyles);
    el.style.color = textColor;
    el.style.maxWidth = "480px";
    el.style.fontFamily = "Inter, sans-serif";
    return el;
  }

  if (category === "alert") {
    el = document.createElement("div");
    el.style.maxWidth = "480px";
    el.style.width = "100%";
    const icon  = pv?.icon  ?? "📢";
    const title = pv?.title ?? "Alert";
    const body  = pv?.body  ?? "Alert message.";
    Object.assign(el.style, computedStyles);
    const alertBg = computedColors["background-color"] ?? computedColors["background"];
    if (isValidColor(alertBg)) el.style.backgroundColor = alertBg;
    const alertFg = computedColors["color"];
    const alertText = isValidColor(alertFg) ? alertFg : textColor;
    el.style.color = alertText;
    const alertBorder = computedColors["border-color"];
    if (isValidColor(alertBorder)) { el.style.borderColor = alertBorder; el.style.borderWidth = "1px"; el.style.borderStyle = "solid"; }
    el.innerHTML = `
      <div style="display:flex;align-items:flex-start;gap:10px;">
        <span style="font-size:1.1rem;flex-shrink:0;margin-top:1px">${icon}</span>
        <div>
          <div style="font-weight:700;font-size:0.88rem;margin-bottom:3px;font-family:Inter,sans-serif;color:inherit">${title}</div>
          <div style="font-size:0.82rem;line-height:1.5;font-family:Inter,sans-serif;color:inherit">${body}</div>
        </div>
      </div>`;
    return el;
  }

  if (category === "toast") {
    el = document.createElement("div");
    el.style.width = "min(360px, 100%)";
    const title = pv?.title ?? "Notification";
    const body  = pv?.body  ?? "";
    Object.assign(el.style, computedStyles);
    const toastBg = computedColors["background-color"] ?? computedColors["background"];
    if (isValidColor(toastBg)) el.style.backgroundColor = toastBg;
    const toastColor = computedColors["color"];
    el.style.color = isValidColor(toastColor) ? toastColor : textColor;
    el.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;font-family:Inter,sans-serif">
        <span style="color:#4ade80;font-size:1rem;flex-shrink:0">✓</span>
        <div>
          <div style="font-weight:700;font-size:0.85rem;margin-bottom:2px;color:inherit">${title}</div>
          <div style="font-size:0.75rem;opacity:0.75;color:inherit">${body}</div>
        </div>
        <button style="margin-left:auto;background:none;border:none;cursor:pointer;opacity:0.5;font-size:1rem;color:inherit">✕</button>
      </div>`;
    return el;
  }

  if (category === "nav") {
    el = document.createElement("nav");
    el.style.width = "100%";
    el.style.maxWidth = "580px";
    const logo  = pv?.logo  ?? "◆ Brand";
    const links = pv?.links ?? ["Docs", "API", "GitHub"];
    const cta   = pv?.cta   ?? "Get Started";
    const linksHtml = links.map((l) =>
      `<a href="#" style="color:${mutedColor};text-decoration:none;font-size:0.83rem">${l}</a>`
    ).join("");
    Object.assign(el.style, computedStyles);
    const navBg = computedColors["background-color"] ?? computedColors["background"];
    if (isValidColor(navBg)) el.style.backgroundColor = navBg;
    else el.style.backgroundColor = isDark ? "#1d2133" : "#ffffff";
    const navBorder = computedColors["border-color"];
    if (isValidColor(navBorder)) { el.style.borderColor = navBorder; el.style.borderWidth = "1px"; el.style.borderStyle = "solid"; }
    else { el.style.borderColor = isDark ? "#2e3350" : "#e2e8f0"; el.style.borderWidth = "1px"; el.style.borderStyle = "solid"; }
    el.style.borderRadius = el.style.borderRadius || "8px";
    el.style.padding = el.style.padding || "12px 16px";
    el.innerHTML = `
      <div style="display:flex;align-items:center;font-family:Inter,sans-serif;flex-wrap:wrap;gap:0.75rem">
        <span style="font-weight:700;color:${textColor};font-size:0.95rem">${logo}</span>
        <span style="flex:1"></span>
        ${linksHtml}
        <button style="background:#6366f1;color:white;border:none;padding:6px 14px;border-radius:6px;font-size:0.8rem;font-weight:600;cursor:pointer;font-family:Inter,sans-serif">${cta}</button>
      </div>`;
    return el;
  }

  if (category === "form") {
    el = document.createElement("div");
    el.style.maxWidth = "360px";
    el.style.width = "100%";
    el.style.fontFamily = "Inter, sans-serif";
    Object.assign(el.style, computedStyles);
    if (intentId.includes("destructive")) {
      const heading     = pv?.heading     ?? "Confirm Deletion";
      const description = pv?.description ?? "This action cannot be undone.";
      const placeholder = pv?.placeholder ?? "Type DELETE to confirm";
      el.innerHTML = `
        <div style="font-weight:700;font-size:0.9rem;margin-bottom:6px;display:flex;align-items:center;gap:6px;color:${textColor}">
          ⚠️ ${heading}
        </div>
        <p style="font-size:0.8rem;color:${mutedColor};margin-bottom:10px;line-height:1.5">${description}</p>
        <input type="text" placeholder="${placeholder}"
          style="width:100%;padding:8px 12px;border-radius:6px;border:1.5px solid #ef4444;
                 background:${isDark ? "rgba(239,68,68,0.08)" : "rgba(239,68,68,0.04)"};
                 color:${textColor};font-size:0.83rem;font-family:inherit;outline:none;box-sizing:border-box;" />`;
    } else {
      const label       = pv?.label      ?? "Label";
      const placeholder = pv?.placeholder ?? "Enter value";
      const inputType   = pv?.inputType  ?? "text";
      const helperText  = pv?.helperText ?? "";
      el.innerHTML = `
        <label style="display:block;font-size:0.78rem;font-weight:600;margin-bottom:6px;color:${mutedColor}">${label}</label>
        <input type="${inputType}" placeholder="${placeholder}"
          style="width:100%;padding:9px 12px;border-radius:6px;border:1.5px solid ${borderCol};
                 background:${inputBg};color:${textColor};
                 font-size:0.85rem;font-family:inherit;outline:none;box-sizing:border-box;" />
        ${helperText ? `<p style="font-size:0.72rem;color:${mutedColor};margin-top:5px">${helperText}</p>` : ""}`;
    }
    return el;
  }

  if (category === "container") {
    el = document.createElement("div");
    el.style.width = "100%";
    el.style.maxWidth = "580px";
    const label       = pv?.label       ?? intentId;
    const description = pv?.description ?? "Layout container.";
    Object.assign(el.style, computedStyles);
    el.innerHTML = `
      <div style="border:2px dashed ${isDark ? "#2e3350" : "#cbd5e1"};border-radius:8px;padding:24px;text-align:center;font-family:Inter,sans-serif">
        <div style="color:${isDark ? "#6366f1" : "#4f46e5"};font-weight:700;font-size:0.85rem;margin-bottom:4px;letter-spacing:0.05em;text-transform:uppercase">
          ${label}
        </div>
        <div style="color:${mutedColor};font-size:0.78rem">${description}</div>
      </div>`;
    return el;
  }

  // ── Generic card fallback ──
  el = document.createElement("div");
  el.style.maxWidth = "340px";
  el.style.width = "100%";
  el.style.fontFamily = "Inter, sans-serif";

  // Use preview title/body first, fall back to entry label/description
  const cardTitle = pv?.title ?? entry?.label ?? intentId;
  const cardBody  = pv?.body  ?? entry?.description ??
    "This element is styled by the Mastors semantic resolver.";

  // Apply non-color computed styles (padding, radius, shadow, etc.)
  Object.assign(el.style, computedStyles);

  // Apply background: use resolved token if valid, otherwise theme fallback
  const resolvedBg = computedColors["background-color"] ?? computedColors["background"];
  el.style.backgroundColor = isValidColor(resolvedBg)
    ? resolvedBg
    : isDark ? "#1d2133" : "#ffffff";

  // Apply border color similarly
  const resolvedBorder = computedColors["border-color"];
  el.style.borderColor = isValidColor(resolvedBorder)
    ? resolvedBorder!
    : isDark ? "#2e3350" : "#e2e8f0";
  if (!el.style.borderWidth) {
    el.style.borderWidth  = "1px";
    el.style.borderStyle  = "solid";
  }

  el.innerHTML = `
    <div style="font-weight:700;font-size:0.95rem;margin-bottom:6px;color:${textColor}">${cardTitle}</div>
    <p style="font-size:0.82rem;line-height:1.6;color:${mutedColor};margin:0">${cardBody}</p>
    <div style="margin-top:12px;display:flex;gap:8px;flex-wrap:wrap">
      <button style="background:#6366f1;color:white;border:none;padding:6px 14px;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit">Primary</button>
      <button style="background:transparent;color:${mutedColor};border:1px solid ${borderCol};padding:6px 14px;border-radius:6px;font-size:0.78rem;font-weight:600;cursor:pointer;font-family:inherit">Secondary</button>
    </div>`;
  return el;
}

// ── Build CSS string ──────────────────────────────────────────
function buildCSS(intentId: string, styleMap: ResolvedStyleMap): string {
  const cls = `m-intent-${intentId.replace(/\./g, "-")}`;
  if (styleMap.base.length === 0) {
    return `/* No vocabulary entry found for "${intentId}" */\n/* Add it to your mastors.config.ts vocabulary. */`;
  }
  const baseRules = styleMap.base.map((r: StyleRule) => {
    const prop = toKebab(r.property);
    const val  = r.tokenRef ? resolveTokenValue(r.tokenRef) : String(r.value);
    const ref  = r.tokenRef ? `  /* ${r.tokenRef} */` : "";
    return `  ${prop}: ${val};${ref}`;
  }).join("\n");

  let out = `.${cls} {\n${baseRules}\n}`;
  if (styleMap.animationRules.length > 0) {
    const transitions = styleMap.animationRules
      .map((r) => `${r.property} ${r.duration} ${r.easing}`).join(", ");
    out += `\n\n.${cls} {\n  transition: ${transitions};\n}`;
    out += `\n\n@media (prefers-reduced-motion: reduce) {\n  .${cls} {\n    transition: none;\n  }\n}`;
  }
  return out;
}

// ── Render Rules tab ──────────────────────────────────────────
function renderRules(styleMap: ResolvedStyleMap): void {
  const el = document.getElementById("rules-output")!;
  if (styleMap.base.length === 0) {
    el.innerHTML = `<div class="text-slate-500 text-xs italic">No rules resolved for this intent.</div>`;
    return;
  }
  el.innerHTML = styleMap.base.map((r) => {
    const prop = toKebab((r as StyleRule).property);
    const val  = r.tokenRef ? resolveTokenValue(r.tokenRef) : String(r.value);
    const ref  = r.tokenRef ?? "";
    const swatch = isColorToken(ref) && val.startsWith("#")
      ? `<span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:${val};border:1px solid rgba(255,255,255,0.15);margin-right:4px;vertical-align:middle;flex-shrink:0"></span>`
      : "";
    return `<div class="rule-row">
      <span class="rule-prop">${prop}:</span>
      <span class="rule-val">${swatch}${val}</span>
      ${ref ? `<span class="rule-ref">${ref}</span>` : ""}
    </div>`;
  }).join("");
}

// ── Render A11y tab ───────────────────────────────────────────
function renderA11y(intentId: string, styleMap: ResolvedStyleMap): void {
  const el    = document.getElementById("a11y-output")!;
  const badge = document.getElementById("a11y-badge")!;
  const entry = INTENT_MAP.get(intentId);

  const hasErrors   = styleMap.a11yHints.some((h) => h.severity === "error");
  const hasWarnings = styleMap.a11yHints.some((h) => h.severity === "warning");

  if (hasErrors) {
    badge.className = "text-[0.62rem] font-bold px-2 py-0.5 rounded-full bg-red-900/40 text-red-400 border border-red-800";
    badge.textContent = "FAIL";
  } else if (hasWarnings) {
    badge.className = "text-[0.62rem] font-bold px-2 py-0.5 rounded-full bg-yellow-900/40 text-yellow-400 border border-yellow-800";
    badge.textContent = "WARN";
  } else {
    badge.className = "text-[0.62rem] font-bold px-2 py-0.5 rounded-full bg-green-900/40 text-green-400 border border-green-800";
    badge.textContent = "PASS";
  }

  const iconMap: Record<string, string> = {
    error:   "fa-solid fa-circle-xmark",
    warning: "fa-solid fa-triangle-exclamation",
    info:    "fa-solid fa-circle-info",
  };
  const typeIconMap: Record<string, string> = {
    contrast:       "fa-solid fa-eye",
    focus:          "fa-solid fa-crosshairs",
    aria:           "fa-solid fa-universal-access",
    motion:         "fa-solid fa-person-running",
    "touch-target": "fa-solid fa-hand",
  };

  let html = "";

  if (styleMap.a11yHints.length > 0) {
    html += styleMap.a11yHints.map((h) => `
      <div class="hint-row ${h.severity}">
        <i class="${iconMap[h.severity] ?? "fa-solid fa-circle-info"} flex-shrink-0 mt-0.5"></i>
        <div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <i class="${typeIconMap[h.type] ?? "fa-solid fa-tag"}" style="font-size:0.65rem;opacity:0.7"></i>
            <span style="font-size:0.65rem;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;opacity:0.7">${h.type}</span>
            <span style="font-size:0.65rem;opacity:0.5">·</span>
            <span style="font-size:0.65rem;opacity:0.7">${h.severity.toUpperCase()}</span>
          </div>
          <div>${h.requirement}</div>
        </div>
      </div>`).join("");
  } else {
    html += `<div class="hint-row info">
      <i class="fa-solid fa-circle-check text-green-400 mt-0.5 flex-shrink-0"></i>
      <span>No accessibility concerns detected. This intent resolves cleanly against WCAG 2.2.</span>
    </div>`;
  }

  if (entry?.a11y?.notes?.length) {
    html += `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3d4166;margin-bottom:6px">
        <i class="fa-solid fa-book-open mr-1"></i>Vocabulary Notes (WCAG ${entry.a11y.wcagLevel})
      </div>`;
    html += entry.a11y.notes.map((note) => `
      <div class="hint-row info" style="margin-bottom:3px">
        <i class="fa-solid fa-circle-info flex-shrink-0 mt-0.5" style="opacity:0.6"></i>
        <span>${note}</span>
      </div>`).join("");
    html += `</div>`;
  }

  if (entry?.a11y?.wcagCriteria?.length) {
    html += `<div style="margin-top:10px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.06)">
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3d4166;margin-bottom:6px">
        <i class="fa-solid fa-certificate mr-1"></i>WCAG Criteria
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">`;
    html += entry.a11y.wcagCriteria.map((c) =>
      `<span class="token-chip" title="${c.name}">${c.id} <span style="opacity:0.6">${c.level}</span></span>`
    ).join("");
    html += `</div></div>`;
  }

  el.innerHTML = html;
}

// ── Render Tokens tab ─────────────────────────────────────────
function renderTokens(intentId: string, styleMap: ResolvedStyleMap): void {
  const el    = document.getElementById("tokens-output")!;
  const entry = INTENT_MAP.get(intentId);

  const refs = styleMap.base
    .filter((r) => r.tokenRef)
    .map((r) => ({ prop: toKebab(r.property), ref: r.tokenRef!, val: resolveTokenValue(r.tokenRef!) }));

  if (refs.length === 0 && !entry?.tokenRefs?.length) {
    el.innerHTML = `<div class="text-slate-500 text-xs italic">No token references found for this intent.</div>`;
    return;
  }

  const vocabRefMap = new Map<string, string>();
  if (entry?.tokenRefs) {
    for (const vr of entry.tokenRefs) {
      vocabRefMap.set(vr.property, vr.description);
    }
  }

  const rows = refs.length > 0 ? refs : (entry?.tokenRefs ?? []).map((vr) => ({
    prop: vr.property,
    ref:  vr.token,
    val:  resolveTokenValue(vr.token),
  }));

  el.innerHTML = rows.map(({ prop, ref, val }) => {
    const cssVar = `--mastors-${ref.replace(/^token\./, "").replace(/\./g, "-")}`;
    const desc   = vocabRefMap.get(prop) ?? "";
    const swatch = isColorToken(ref) && val.startsWith("#")
      ? `<span style="display:inline-block;width:28px;height:28px;border-radius:6px;background:${val};border:1px solid rgba(255,255,255,0.1);flex-shrink:0"></span>`
      : `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:6px;background:rgba(99,102,241,0.1);flex-shrink:0">
           <i class="fa-solid fa-tag text-brand-400" style="font-size:0.6rem"></i>
         </span>`;
    return `<div style="display:flex;align-items:flex-start;gap:10px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.04)">
      ${swatch}
      <div style="flex:1;min-width:0">
        <div style="font-family:'Fira Code',monospace;font-size:0.7rem;color:#94a3b8;margin-bottom:2px">${prop}</div>
        <div class="token-chip" style="margin-bottom:4px">${ref}</div>
        <div style="font-family:'Fira Code',monospace;font-size:0.7rem;color:#475569">${cssVar}</div>
        ${desc ? `<div style="font-size:0.68rem;color:#475569;margin-top:2px">${desc}</div>` : ""}
      </div>
      <div style="font-family:'Fira Code',monospace;font-size:0.75rem;color:#e2e8f0;flex-shrink:0;font-weight:600">${val}</div>
    </div>`;
  }).join("");
}

// ── Render Mastors tab ────────────────────────────────────────
function renderMastors(intentId: string): void {
  const el    = document.getElementById("mastors-output")!;
  const entry = INTENT_MAP.get(intentId);
  const m     = entry?.mastors;

  if (!m) {
    el.innerHTML = `<div class="text-slate-500 text-xs italic">No Mastors declaration defined for this intent.</div>`;
    return;
  }

  el.innerHTML = `
    <!-- Description -->
    <div style="margin-bottom:14px;padding:10px 12px;border-radius:7px;background:rgba(99,102,241,0.07);border:1px solid rgba(99,102,241,0.15)">
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#6366f1;margin-bottom:5px">
        <i class="fa-solid fa-circle-info mr-1"></i>How it works
      </div>
      <p style="font-size:0.75rem;line-height:1.6;color:#94a3b8;margin:0">${m.description}</p>
    </div>

    <!-- HTML Declaration -->
    <div style="margin-bottom:10px">
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3d4166;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">
        <span><i class="fa-brands fa-html5 mr-1" style="color:#e2631a"></i>HTML Declaration</span>
        <button class="copy-btn" onclick="copyMastorsBlock('mastors-html-code')" style="opacity:1">
          <i class="fa-solid fa-copy mr-1"></i>Copy
        </button>
      </div>
      <div style="background:#0b0d14;border-radius:6px;border:1px solid #1d2133;padding:12px;overflow-x:auto">
        <pre style="margin:0;padding:0"><code id="mastors-html-code" class="language-html" style="font-size:0.75rem;line-height:1.7;font-family:'Fira Code',monospace">${escapeHtml(m.declaration)}</code></pre>
      </div>
    </div>

    <!-- Config -->
    <div>
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3d4166;margin-bottom:6px;display:flex;align-items:center;justify-content:space-between">
        <span><i class="fa-solid fa-gear mr-1" style="color:#818cf8"></i>mastors.config.ts</span>
        <button class="copy-btn" onclick="copyMastorsBlock('mastors-config-code')" style="opacity:1">
          <i class="fa-solid fa-copy mr-1"></i>Copy
        </button>
      </div>
      <div style="background:#0b0d14;border-radius:6px;border:1px solid #1d2133;padding:12px;overflow-x:auto">
        <pre style="margin:0;padding:0"><code id="mastors-config-code" class="language-typescript" style="font-size:0.75rem;line-height:1.7;font-family:'Fira Code',monospace">${escapeHtml(m.config)}</code></pre>
      </div>
    </div>

    <!-- Related intents -->
    ${entry.relatedIntents?.length ? `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.06)">
      <div style="font-size:0.6rem;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#3d4166;margin-bottom:6px">
        <i class="fa-solid fa-link mr-1"></i>Related Intents
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:4px">
        ${entry.relatedIntents.map((r) =>
          `<button class="token-chip" style="cursor:pointer;border:none;background:rgba(99,102,241,0.1)"
            onclick="selectIntent('${r}')">${r}</button>`
        ).join("")}
      </div>
    </div>` : ""}
  `;

  // Re-highlight with Prism if available
  const pw = window as unknown as Record<string, { highlightElement(el: Element): void }>;
  if (pw["Prism"]) {
    const htmlEl   = document.getElementById("mastors-html-code");
    const configEl = document.getElementById("mastors-config-code");
    if (htmlEl)   pw["Prism"].highlightElement(htmlEl);
    if (configEl) pw["Prism"].highlightElement(configEl);
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function copyMastorsBlock(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  navigator.clipboard.writeText(el.textContent ?? "").then(() => {
    const btn = el.closest("div")?.previousElementSibling?.querySelector(".copy-btn") as HTMLButtonElement | null;
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  });
}
(window as unknown as Record<string, unknown>)["copyMastorsBlock"] = copyMastorsBlock;

function selectIntent(id: string): void {
  const input = document.getElementById("intent-input") as HTMLInputElement;
  input.value = id;
  update(id);
}
(window as unknown as Record<string, unknown>)["selectIntent"] = selectIntent;

// ── Tab switching ─────────────────────────────────────────────
function switchTab(tab: typeof currentTab): void {
  currentTab = tab;
  const tabs = ["css", "rules", "a11y", "tokens", "mastors"] as const;
  for (const t of tabs) {
    const btn   = document.getElementById(`tab-${t}`)!;
    const panel = document.getElementById(`panel-${t}`)!;
    const isActive = t === tab;
    btn.classList.toggle("active", isActive);
    btn.classList.toggle("text-slate-300", isActive);
    btn.classList.toggle("border-brand-500", isActive);
    btn.classList.toggle("text-slate-500", !isActive);
    btn.classList.toggle("border-transparent", !isActive);
    panel.classList.toggle("hidden", !isActive);
    panel.classList.toggle("flex",   isActive);
  }
}
(window as unknown as Record<string, unknown>)["switchTab"] = switchTab;

// ── Preview theme ─────────────────────────────────────────────
function setPreviewTheme(theme: "light" | "dark"): void {
  currentTheme = theme;
  const pane = document.getElementById("preview-pane")!;
  pane.classList.toggle("is-dark", theme === "dark");
  document.getElementById("btn-light")!.classList.toggle("active", theme === "light");
  document.getElementById("btn-dark")!.classList.toggle("active",  theme === "dark");
  const input = document.getElementById("intent-input") as HTMLInputElement;
  update(input.value.trim(), false);
}
(window as unknown as Record<string, unknown>)["setPreviewTheme"] = setPreviewTheme;

// ── Copy CSS ──────────────────────────────────────────────────
function copyCSS(): void {
  if (!lastCSS) return;
  navigator.clipboard.writeText(lastCSS).then(() => {
    const btn = document.querySelector(".copy-btn") as HTMLButtonElement;
    if (!btn) return;
    const orig = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-check mr-1"></i>Copied!';
    setTimeout(() => { btn.innerHTML = orig; }, 1500);
  });
}
(window as unknown as Record<string, unknown>)["copyCSS"] = copyCSS;

// ── Main update ───────────────────────────────────────────────
function update(intentId: string, rehighlight = true): void {
  if (!intentId) return;
  const t0 = performance.now();

  document.getElementById("status-intent")!.textContent = intentId;
  document.getElementById("preview-intent-badge")!.textContent = intentId;

  const isValid = /^[a-z][a-z0-9]*(\.[a-z][a-z0-9-]*){0,3}$/.test(intentId);
  const statusIcon = document.getElementById("intent-status-icon")!;
  const statusText = document.getElementById("intent-status-text")!;
  if (!isValid) {
    statusIcon.className = "fa-solid fa-circle-xmark text-red-400";
    statusText.textContent = "Invalid — use dot.notation format";
    document.getElementById("preview-mount")!.innerHTML =
      `<div style="color:#f87171;font-size:0.85rem;font-family:Inter,sans-serif;text-align:center">
        <i class="fa-solid fa-triangle-exclamation" style="display:block;font-size:2rem;margin-bottom:8px;opacity:0.5"></i>
        Invalid intent identifier.<br>
        <span style="opacity:0.6;font-size:0.75rem">Format: category.variant.modifier</span>
       </div>`;
    return;
  }

  let styleMap: ResolvedStyleMap;
  try {
    const descriptor = resolver.describe(intentId);
    styleMap = resolver.resolve(descriptor);
  } catch (e) {
    statusIcon.className = "fa-solid fa-circle-xmark text-red-400";
    statusText.textContent = e instanceof Error ? e.message : "Resolver error";
    return;
  }

  statusIcon.className = "fa-solid fa-circle-check text-green-400";
  statusText.textContent = styleMap.base.length > 0
    ? `Resolved · ${styleMap.base.length} rule${styleMap.base.length !== 1 ? "s" : ""}`
    : "Intent valid — no vocabulary entry found";

  const mount = document.getElementById("preview-mount")!;
  mount.innerHTML = "";
  mount.appendChild(buildPreviewEl(intentId, styleMap));

  const cssText = buildCSS(intentId, styleMap);
  lastCSS = cssText;
  const codeEl = document.getElementById("css-output")!;
  codeEl.textContent = cssText;
  if (rehighlight && (window as unknown as Record<string, unknown>)["Prism"]) {
    (window as unknown as Record<string, { highlightElement(el: Element): void }>)["Prism"].highlightElement(codeEl);
  }

  renderRules(styleMap);
  renderA11y(intentId, styleMap);
  renderTokens(intentId, styleMap);
  renderMastors(intentId);

  const t1 = performance.now();
  const ms = (t1 - t0).toFixed(2);
  document.getElementById("stat-rules")!.textContent = String(styleMap.base.length);
  document.getElementById("stat-hints")!.textContent = String(styleMap.a11yHints.length);
  document.getElementById("stat-time")!.textContent  = ms;
  document.getElementById("status-rules")!.textContent   = `${styleMap.base.length} rules`;
  document.getElementById("status-time-bar")!.textContent = `${ms}ms`;

  document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.classList.toggle("active", btn.getAttribute("data-intent") === intentId);
  });
}

// ── Build sidebar preset list ─────────────────────────────────
function buildPresetList(): void {
  const list = document.getElementById("preset-list")!;
  for (const cat of VOCAB_CATEGORIES) {
    const catEl = document.createElement("div");
    catEl.className = "cat-label";
    catEl.innerHTML = `<i class="${cat.icon} mr-1.5 opacity-50"></i>${cat.label}`;
    list.appendChild(catEl);

    for (const intent of cat.intents) {
      const btn = document.createElement("button");
      btn.className = "preset-btn";
      btn.textContent = intent.shortLabel;
      btn.setAttribute("data-intent", intent.id);
      btn.title = intent.description;
      btn.addEventListener("click", () => {
        (document.getElementById("intent-input") as HTMLInputElement).value = intent.id;
        update(intent.id);
      });
      list.appendChild(btn);
    }
  }
}

// ── Input debounce ────────────────────────────────────────────
let debounceTimer: ReturnType<typeof setTimeout>;
(document.getElementById("intent-input") as HTMLInputElement).addEventListener("input", (e) => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    update((e.target as HTMLInputElement).value.trim());
  }, 200);
});

// ── Boot ──────────────────────────────────────────────────────
buildPresetList();
setPreviewTheme("dark");   // establish dark as the primary theme explicitly
update("card.elevated.interactive");
