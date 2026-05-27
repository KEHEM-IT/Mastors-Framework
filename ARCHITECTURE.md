# ARCHITECTURE.md — Mastors Framework
## Five-Layer Intent-Based Styling System

---

## Overview

Mastors processes every style declaration through a deterministic five-layer pipeline.
Each layer has a single responsibility and communicates via well-typed interfaces.

```
Developer Code
     │
     ▼
┌─────────────────────────────────────┐
│  LAYER 1: Intent Declaration API    │  @mastors/api
│  intent() · semantics() · compose() │
└──────────────┬──────────────────────┘
               │ IntentDescriptor
               ▼
┌─────────────────────────────────────┐
│  LAYER 2: Semantic Resolver Engine  │  @mastors/core
│  Token map · Context · AI hints     │
└──────────────┬──────────────────────┘
               │ ResolvedStyleMap
               ▼
┌─────────────────────────────────────┐
│  LAYER 3: Adaptive Runtime          │  @mastors/core
│  Responsive · Themes · Motion       │
└──────────────┬──────────────────────┘
               │ AdaptedStyleMap
               ▼
┌─────────────────────────────────────┐
│  LAYER 4: Accessibility Guard       │  @mastors/accessibility
│  WCAG 2.2 · ARIA · Contrast         │
└──────────────┬──────────────────────┘
               │ ValidatedStyleMap + A11yManifest
               ▼
┌─────────────────────────────────────┐
│  LAYER 5: Output Compiler           │  @mastors/compiler
│  Atomic CSS · Token inject · SSR    │
└──────────────┬──────────────────────┘
               │
               ▼
         Zero-runtime CSS
```

---

## Layer 1 — Intent Declaration API (`packages/api`)

**Purpose:** The public developer-facing surface. Accepts human-readable semantic intent strings.

**Primary exports:**
- `intent(id: string, ctx?: IntentContext): IntentDescriptor`
- `semantics(rules: SemanticsConfig): void`
- `compose(...intents: IntentDescriptor[]): IntentDescriptor`
- `defineSchema(config: SchemaConfig): MastorsSchema`

**Semantic identifier format:**
```
category.variant.modifier
   │        │       │
   │        │       └── behavioral context (interactive, sticky, compact...)
   │        └────────── visual variant    (elevated, subtle, destructive...)
   └─────────────────── semantic category (card, button, nav, heading...)
```

**Examples:**
```ts
intent("card.elevated.interactive")
intent("button.primary.cta")
intent("nav.primary.sticky")
intent("alert.destructive")
intent("heading.hero")
```

---

## Layer 2 — Semantic Resolver Engine (`packages/core`)

**Purpose:** Maps intent identifiers to concrete design token paths and style rules.

**Resolution stages:**
1. **Lexical parse** — tokenize dot-notation identifier into semantic segments
2. **Vocabulary lookup** — match segments against the loaded semantic schema
3. **Token expansion** — resolve token references to CSS custom property paths
4. **Context inference** — apply parent-component, viewport, and theme context

**Determinism guarantee:** Identical inputs → identical outputs (required for SSR correctness).

**Extensibility:** Custom semantic vocabularies via `defineSchema()`. Plugin hooks at each stage.

---

## Layer 3 — Adaptive Runtime (`packages/core`)

**Purpose:** Generates all responsive, theme, and motion variants from a single resolved map.

**Responsibilities:**
- **Responsive optimizer** — generates container-query-aware CSS variants, not just breakpoints
- **Theme scaler** — injects correct token values for light, dark, high-contrast, brand, print, density themes
- **Motion orchestrator** — wraps animation intents in `prefers-reduced-motion` guards automatically

**Output:** A complete `AdaptedStyleMap` with all variants, ready for the A11y Guard.

---

## Layer 4 — Accessibility Guard (`packages/accessibility`)

**Purpose:** Enforces WCAG 2.2 compliance on every resolved style before compilation.

**Checks performed:**
- Contrast ratio validation (AA minimum, AAA optional)
- Focus indicator presence and visibility (`:focus-visible` ring)
- ARIA role recommendations per semantic category
- `prefers-reduced-motion` guard verification
- Touch target minimum size (48×48px)

**Modes:**
- `warn` — logs violations to console (default in dev)
- `enforce` — throws build errors on violations (use in CI/CD)
- `report` — generates `mastors-a11y-manifest.json` alongside CSS

---

## Layer 5 — Output Compiler (`packages/compiler`)

**Purpose:** Transforms validated style maps into optimized, zero-runtime CSS output.

**Output formats:**
- **Atomic CSS** — one class per property, deduplicated across all intents (default)
- **CSS Custom Properties** — injects design tokens as `--mastors-*` variables
- **CSS Modules** — scoped class names for framework module systems
- **Framework bindings** — React `className`, Vue `:class`, Svelte `class:` directives

**Performance targets:**
- Sub-100ms incremental compilation for projects up to 10,000 intents
- Zero JavaScript in the browser style critical path
- Output CSS smaller than equivalent Tailwind purged output

---

## Package Dependency Graph

```
@mastors/types          (no internal deps — pure TypeScript types)
      │
@mastors/utils          (depends: types)
      │
@mastors/tokens         (depends: types, utils)
@mastors/schemas        (depends: types, utils)
      │
@mastors/accessibility  (depends: types, utils, tokens)
      │
@mastors/core           (depends: types, utils, tokens, schemas, accessibility)
      │
@mastors/compiler       (depends: types, utils, core)
      │
@mastors/api            (depends: types, core, compiler)
      │
      ├── @mastors/adapters/react
      ├── @mastors/adapters/vue
      ├── @mastors/adapters/svelte
      ├── @mastors/plugins/vite
      └── @mastors/plugins/webpack
```

---

## Design Principles

1. **Determinism** — Same input always produces same output. No hidden state.
2. **Zero runtime** — All resolution at build time. No JS in the browser style path.
3. **Fail loudly** — A11y violations are errors in CI, not warnings in production.
4. **Extensible by default** — Every layer exposes plugin hooks.
5. **Framework neutral** — The core has zero framework dependencies.
