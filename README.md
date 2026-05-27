# Mastors — Intent-Based Styling Framework

> **"Style is the expression of intent. When you know what something means, you know how it should look."**

Mastors is a next-generation frontend styling framework built on the principle of **Intent-Based Styling**. Instead of writing utility classes or style objects, developers declare *what* a UI element *is* — its semantic role, context, and behavior — and Mastors resolves *how it looks*: accessible, responsive, theme-aware, and zero-runtime.

```ts
import { intent } from "mastors";

const card = intent("card.elevated.interactive");
// Mastors resolves automatically:
// ✓ Elevation shadow from design tokens
// ✓ Accessible focus ring (WCAG 2.2 AA)
// ✓ Responsive padding / sizing
// ✓ Hover / active motion (respects prefers-reduced-motion)
// ✓ Theme-aware colors
```

---

## Table of Contents

- [Architecture](#architecture)
- [Monorepo Structure](#monorepo-structure)
- [Packages](#packages)
- [Getting Started](#getting-started)
- [Semantic Vocabulary](#semantic-vocabulary)
- [Framework Adapters](#framework-adapters)
- [Build Plugins](#build-plugins)
- [Accessibility Guard](#accessibility-guard)
- [Design Tokens](#design-tokens)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Roadmap](#roadmap)

---

## Architecture

Mastors is organized into **five layers**, each handling a distinct stage of the styling pipeline:

```
LAYER 1 — Intent Declaration API       @mastors/api
          intent() · semantics() · compose()
              ↓
LAYER 2 — Semantic Resolver Engine     @mastors/core
          Token mapping · Context inference · Plugin hooks
              ↓
LAYER 3 — Adaptive Runtime             @mastors/core
          Responsive optimizer · Theme scaler · Motion orchestrator
              ↓
LAYER 4 — Accessibility & Contrast Guard   @mastors/accessibility
          WCAG 2.2 · ARIA automation · Contrast ratio enforcer
              ↓
LAYER 5 — Output Compiler              @mastors/compiler
          Zero-runtime atomic CSS · Class deduplication · Token injection
```

All resolution happens at **build time**. The browser receives plain atomic CSS — no JavaScript in the styling critical path.

---

## Monorepo Structure

```
mastors/
├── packages/
│   ├── types/           # @mastors/types       — Shared TypeScript definitions
│   ├── utils/           # @mastors/utils       — Utility functions
│   ├── tokens/          # @mastors/tokens      — Design token registry
│   ├── schemas/         # @mastors/schemas     — Built-in semantic vocabulary
│   ├── core/            # @mastors/core        — Semantic Resolver Engine
│   ├── accessibility/   # @mastors/accessibility — WCAG 2.2 Guard Layer
│   ├── compiler/        # @mastors/compiler    — Zero-runtime CSS Output Compiler
│   ├── api/             # @mastors/api         — Public Intent Declaration API
│   ├── adapters/
│   │   ├── react/       # @mastors/adapter-react   — useIntent() hook, <Mastors.*>
│   │   ├── vue/         # @mastors/adapter-vue     — v-intent directive, composable
│   │   └── svelte/      # @mastors/adapter-svelte  — use:intentAction action
│   └── plugins/
│       ├── vite/        # @mastors/plugin-vite     — Vite build plugin
│       └── webpack/     # @mastors/plugin-webpack  — webpack build plugin
├── playground/          # Interactive intent explorer (Vite dev app)
├── schemas/             # Example config & default token JSON
├── tsconfig.json        # Root TypeScript config (composite project references)
├── vitest.config.ts     # Vitest test runner config
├── pnpm-workspace.yaml  # pnpm workspace definition
└── package.json         # Root scripts and dev dependencies
```

---

## Packages

### `@mastors/api` — Intent Declaration API

The public developer-facing API. Three core functions:

```ts
import { intent, semantics, compose, configure } from "@mastors/api";

// Initialize with your project schema (call once at app entry)
configure({ schema: mySchema, a11yMode: "warn" });

// Declare intent — returns an IntentDescriptor
const card = intent("card.elevated.interactive");

// Declare intent and get CSS classes directly (requires configure())
const classes = intentClass("button.primary.cta");
// → "m-padding-left-abc123 m-background-color-def456 m-intent-button-primary-cta"

// Add global semantic rules to the active schema
semantics({
  "financial.data.negative": {
    color: { foreground: "token.color.error.700" },
  },
});

// Compose multiple intents (last wins for conflicts)
const heroCard = compose("card.elevated", "card.elevated.interactive");
```

### `@mastors/core` — Semantic Resolver Engine

```ts
import { SemanticResolver, defaultResolver } from "@mastors/core";

const resolver = new SemanticResolver(mySchema);

// Parse an intent string into a typed descriptor
const descriptor = resolver.describe("card.elevated.interactive");

// Resolve descriptor → full style map (base rules, variants, a11y hints, animation)
const styleMap = resolver.resolve(descriptor);
// styleMap.base          → StyleRule[]
// styleMap.a11yHints     → A11yHint[]
// styleMap.animationRules → AnimationRule[]
```

Resolver results are **cached** by intent ID + context. Call `resolver.clearCache()` when the schema changes.

### `@mastors/accessibility` — WCAG 2.2 Guard

```ts
import {
  contrastRatio,
  meetsContrastRequirement,
  generateFocusRing,
  AccessibilityGuard,
} from "@mastors/accessibility";

contrastRatio("#3b82f6", "#ffffff");             // → 3.94
meetsContrastRequirement("#000", "#fff", "AA");  // → true

const guard = new AccessibilityGuard("enforce", tokenRegistry);
guard.check(intentId, styleMap);                 // throws on error-level violations
guard.generateManifest(totalIntents);            // → A11yManifest JSON
```

Guard modes: `"warn"` (console), `"enforce"` (throws), `"report"` (silent collect), `"off"`.

### `@mastors/tokens` — Design Token Registry

```ts
import { TokenRegistry, defaultTokens } from "@mastors/tokens";

const registry = new TokenRegistry(defaultTokens);
registry.resolve("token.space.4");            // → "1rem"
registry.resolveToVar("token.shadow.elevated"); // → { cssVar: "--mastors-shadow-elevated", fallback: "..." }
registry.generateCssVars(":root");            // → ":root { --mastors-space-4: 1rem; ... }"

// Extend with project overrides (immutable — returns new registry)
const custom = registry.extend({ token: { space: { "4": "0.875rem" } } });
```

### `@mastors/compiler` — Output Compiler

```ts
import { MastorsCompiler } from "@mastors/compiler";

const compiler = new MastorsCompiler({ schema, a11yMode: "warn" });
const output = compiler.compile(["card.elevated.interactive", "button.primary"]);

output.css;           // Deduplicated atomic CSS + responsive variants + motion guards
output.tokenVars;     // :root { --mastors-* } block
output.classes;       // { "card.elevated.interactive": ["m-box-shadow-abc", ...] }
output.a11yManifest;  // { totalIntents, violations, passCount, failCount }
```

### `@mastors/schemas` — Semantic Vocabulary

```ts
import { defineSchema, defaultSchema, builtinVocabulary } from "@mastors/schemas";

// Type-safe schema definition for mastors.config.ts
export default defineSchema({
  tokens: "./tokens/global.json",
  vocabulary: {
    "card.elevated.interactive": {
      spacing: { x: "token.space.4", y: "token.space.3" },
      shadow: "token.shadow.elevated",
      radius: "token.radius.lg",
      interaction: { hover: "lift", focus: "ring.primary" },
      motion: "transition.natural",
      a11y: { role: "article", contrast: "AA" },
    },
  },
});
```

---

## Getting Started

### 1. Install

```bash
pnpm add @mastors/api @mastors/core @mastors/compiler @mastors/schemas @mastors/tokens @mastors/types
```

### 2. Configure

Create `mastors.config.ts` in your project root:

```ts
import { defineSchema } from "@mastors/schemas";

export default defineSchema({
  tokens: "./tokens/global.json",
  vocabulary: {
    // your custom intents here — extends built-in vocabulary
  },
});
```

### 3. Add the Vite plugin

```ts
// vite.config.ts
import { mastorsPlugin } from "@mastors/plugin-vite";
import schema from "./mastors.config";

export default defineConfig({
  plugins: [
    mastorsPlugin({ config: { schema, a11yMode: "warn" } }),
  ],
});
```

### 4. Import the virtual CSS module

```ts
// main.ts / app entry
import "virtual:mastors";
```

### 5. Declare intent

```ts
import { intent } from "@mastors/api";

const card = intent("card.elevated.interactive");
// Use `card` with your framework adapter (see below)
```

---

## Semantic Vocabulary

Mastors ships with a built-in vocabulary covering common UI patterns:

| Category | Example Intents |
|---|---|
| Cards | `card.base`, `card.elevated`, `card.elevated.interactive` |
| Buttons | `button.primary`, `button.primary.cta`, `button.secondary`, `button.destructive` |
| Typography | `heading.hero`, `heading.section`, `body.readable`, `body.readable.longform` |
| Navigation | `nav.primary`, `nav.primary.sticky` |
| Alerts | `alert.info`, `alert.success`, `alert.warning`, `alert.destructive` |
| Feedback | `toast.success.transient` |
| Forms | `form.field`, `form.destructive.confirm` |
| Layout | `container.max.centered` |

All built-in intents resolve contrast, focus, motion, and ARIA automatically.

---

## Framework Adapters

### React

```tsx
import { useIntent, Mastors } from "@mastors/adapter-react";

// Hook — resolves to a className string
function Card() {
  const className = useIntent("card.elevated.interactive");
  return <div className={className}>...</div>;
}

// Component namespace — intent prop on any HTML element
<Mastors.div intent="card.elevated.interactive">
  <Mastors.h2 intent="heading.section">Title</Mastors.h2>
  <Mastors.button intent="button.primary.cta">Get Started</Mastors.button>
</Mastors.div>
```

### Vue 3

```vue
<script setup>
import { useIntent, MastorsComponent } from "@mastors/adapter-vue";
const cardClass = useIntent("card.elevated.interactive");
</script>

<template>
  <!-- Composable -->
  <div :class="cardClass">...</div>

  <!-- Directive (register MastorsPlugin globally first) -->
  <div v-intent="'button.primary.cta'">...</div>

  <!-- Component -->
  <MastorsComponent as="section" intent="container.max.centered">
    ...
  </MastorsComponent>
</template>
```

Register globally:
```ts
import { MastorsPlugin } from "@mastors/adapter-vue";
app.use(MastorsPlugin);
```

### Svelte

```svelte
<script>
  import { resolveIntent, intentAction } from "@mastors/adapter-svelte";
  const cardClass = resolveIntent("card.elevated.interactive");
</script>

<!-- Class binding -->
<div class={cardClass}>...</div>

<!-- Action (reactive, updates on change) -->
<div use:intentAction={"card.elevated.interactive"}>...</div>
```

---

## Build Plugins

### Vite

```ts
// vite.config.ts
import { mastorsPlugin } from "@mastors/plugin-vite";

export default defineConfig({
  plugins: [
    mastorsPlugin({
      config: { schema, a11yMode: "warn" },
      include: ["ts", "tsx", "vue", "svelte"], // file extensions to scan
      a11yManifest: true,                       // emit mastors-a11y.json
    }),
  ],
});
```

The plugin scans source files for `intent("...")` calls, compiles CSS at build time, and serves it via the `virtual:mastors` module. HMR is supported.

### webpack

```js
// webpack.config.js
const { MastorsWebpackPlugin } = require("@mastors/plugin-webpack");

module.exports = {
  plugins: [
    new MastorsWebpackPlugin({
      config: { schema, a11yMode: "warn" },
      filename: "mastors.css", // output filename
    }),
  ],
};
```

---

## Accessibility Guard

The Accessibility Guard runs on every resolved intent and enforces WCAG 2.2 compliance:

- **Contrast enforcement** — checks foreground/background pairs against AA or AAA thresholds
- **Focus ring generation** — ensures interactive elements have a visible focus indicator
- **ARIA recommendations** — suggests required attributes for semantic roles
- **Motion sensitivity** — wraps all transition rules in `prefers-reduced-motion: reduce` guards

**Guard modes** (set via `a11yMode` in config):

| Mode | Behavior |
|---|---|
| `"warn"` | Logs violations to `console.warn` — default for development |
| `"enforce"` | Throws on `error`-severity violations — use in CI/CD |
| `"report"` | Silently collects all violations — generates manifest |
| `"off"` | Disables guard entirely |

---

## Design Tokens

Mastors uses a dot-notation token path system that maps to CSS custom properties:

```
token.space.4           →  --mastors-space-4: 1rem
token.shadow.elevated   →  --mastors-shadow-elevated: 0 10px 15px -3px ...
token.color.primary.500 →  --mastors-color-primary-500: #3b82f6
```

The default token scale covers spacing (4pt base), typography, font weights, line heights, border radius, box shadows, semantic colors, z-index, transition durations, and easing functions. See `packages/tokens/src/index.ts` for the full scale.

To override tokens, extend the registry in your config:

```ts
defineSchema({
  tokens: "./my-tokens.json", // Style Dictionary / W3C / Figma Tokens format
  vocabulary: { ... },
});
```

---

## Configuration

Full `MastorsConfig` type:

```ts
type MastorsConfig = {
  schema: MastorsSchema;           // required — your semantic schema
  a11yMode?: "warn"                // default: "warn"
            | "enforce"
            | "report"
            | "off";
  outputFormat?: "atomic"          // default: "atomic"
               | "css-modules"
               | "css-vars";
  themes?: string[];               // theme names to generate variants for
  defaultTheme?: string;           // default active theme
};
```

---

## Development

```bash
# Install all workspace dependencies
pnpm install

# Type-check the entire monorepo
pnpm typecheck

# Build all packages (respects project reference order)
pnpm build

# Run tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests with coverage
pnpm test:coverage

# Start the interactive playground
pnpm playground

# Clean all build artifacts
pnpm clean
```

### Playground

The playground (`/playground`) is a browser-based intent explorer. It lets you type any intent identifier and instantly see:
- Live preview of the rendered element
- Resolved CSS output with token annotations
- Accessibility hints panel
- Resolver timing

```bash
cd playground
pnpm dev
# Opens at http://localhost:5173
```

---

## Testing

Tests use [Vitest](https://vitest.dev/) and live alongside source files as `*.test.ts`:

```
packages/utils/src/index.test.ts          # Utility function tests
packages/tokens/src/index.test.ts         # TokenRegistry tests
packages/schemas/src/index.test.ts        # Vocabulary coverage tests
packages/core/src/index.test.ts           # SemanticResolver tests (all 19 built-in intents)
packages/accessibility/src/index.test.ts  # WCAG contrast + AccessibilityGuard tests
packages/compiler/src/index.test.ts       # MastorsCompiler output tests
```

---

## Roadmap

| Phase | Timeline | Milestone |
|---|---|---|
| **1 — Foundation** | Q3–Q4 2025 | Core `intent()` API · Resolver v0.1 · Vite plugin · Playground |
| **2 — Engine** | Q1–Q2 2026 | Zero-runtime compiler · WCAG 2.2 Guard · Animation intents · VSCode extension |
| **3 — AI Integration** | Q3–Q4 2026 | AI cleanup layer (`mastors ai-normalize`) · Figma plugin · Vue & Svelte adapters · Mastors Studio beta |
| **4 — Ecosystem** | 2027+ | Component marketplace · Mastors Cloud · Enterprise compiler · Angular adapter · MCP server for LLMs |

---

## License

MIT — Open Research, Public Domain (Mastors Project 2026)

Based on thesis: *MASTORS — Intent-Based Styling for the Future Web*, v1.0, May 2026.
