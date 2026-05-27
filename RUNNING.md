# How to Run Mastors

Complete step-by-step guide to install, build, test, and run the playground.

---

## Prerequisites

Make sure these are installed on your machine before anything else:

| Tool | Required Version | Check | Install |
|---|---|---|---|
| Node.js | 18 or higher | `node -v` | https://nodejs.org |
| pnpm | 9 or higher | `pnpm -v` | `npm install -g pnpm` |

---

## Step 1 — Install Dependencies

Open a terminal, navigate to the Framework folder, and run:

```bash
cd "D:\Web\Mastors CDN\Framework"
pnpm install
```

This installs all dependencies for every package in the monorepo at once.
It may take 1–2 minutes the first time.

**Expected output:**
```
Lockfile is up to date, resolution step is skipped
Packages: +XXX
Progress: resolved XXX, reused XXX, downloaded 0, added XXX, done
```

---

## Step 2 — Build All Packages

The packages must be built before the playground can run, because the
playground imports from the compiled `dist/` output of each package.

```bash
pnpm build
```

This runs `tsup` in every package in the correct dependency order:
`types` → `utils` → `tokens` → `schemas` → `accessibility` → `core` → `compiler` → `api` → adapters → plugins

**Expected output (one block per package):**
```
@mastors/types       dist/index.js   1.2kb
@mastors/utils       dist/index.js   2.1kb
@mastors/tokens      dist/index.js   4.3kb
...
```

---

## Step 3 — Run the Playground

```bash
pnpm playground
```

This starts a Vite dev server for the interactive intent explorer.
A browser tab will open automatically at:

```
http://localhost:5173
```

### What you'll see

The playground is a three-panel app:

```
┌──────────────────┬──────────────────────────────────┐
│  Intent Input    │                                  │
│  ─────────────   │       LIVE PREVIEW               │
│  Built-in        │   (rendered element with         │
│  Vocabulary      │    resolved styles applied)      │
│  list            │                                  │
│                  ├──────────────┬───────────────────┤
│  Click any       │  Resolved    │  Accessibility    │
│  preset to       │  CSS Output  │  Hints            │
│  resolve it      │              │                   │
└──────────────────┴──────────────┴───────────────────┘
```

**Try typing** any intent in the input box at the top left, for example:
- `card.elevated.interactive`
- `button.primary.cta`
- `heading.hero`
- `alert.destructive`
- `nav.primary.sticky`

The CSS panel shows the exact atomic CSS classes that Mastors would emit
at build time. The A11y panel shows WCAG hints for the intent.

---

## Step 4 — Run the Tests

```bash
pnpm test
```

Runs all test files across every package using Vitest.

**Expected output:**
```
 ✓ packages/utils/src/index.test.ts         (12 tests)
 ✓ packages/tokens/src/index.test.ts        (6 tests)
 ✓ packages/schemas/src/index.test.ts       (8 tests)
 ✓ packages/core/src/index.test.ts          (28 tests)
 ✓ packages/accessibility/src/index.test.ts (14 tests)
 ✓ packages/compiler/src/index.test.ts      (8 tests)

 Test Files  6 passed (6)
 Tests      76 passed (76)
```

Other test commands:

```bash
# Watch mode — re-runs tests on file save
pnpm test:watch

# With code coverage report
pnpm test:coverage
```

---

## Other Useful Commands

```bash
# Type-check all packages without building
pnpm typecheck

# Watch mode — rebuilds packages automatically on source changes
# (useful while developing the framework itself)
pnpm build:watch

# Delete all dist/ folders and node_modules
pnpm clean
# Then re-install with: pnpm install
```

---

## Troubleshooting

### "Cannot find module '@mastors/core'" in the playground

The packages haven't been built yet. Run `pnpm build` first.

### "pnpm: command not found"

Install pnpm globally: `npm install -g pnpm`

### "node: command not found" or wrong Node version

Install Node 18+ from https://nodejs.org. Check your version with `node -v`.

### Port 5173 already in use

Vite will automatically try the next available port (5174, 5175, etc.)
and print the actual URL in the terminal.

### Build error: "composite" tsconfig issues

Run a clean reinstall:
```bash
pnpm clean
pnpm install
pnpm build
```

### pnpm install fails with lockfile errors

```bash
pnpm install --no-frozen-lockfile
```

---

## Quick Reference

```bash
# Full startup sequence (first time)
pnpm install      # install deps
pnpm build        # build all packages
pnpm playground   # open browser at localhost:5173

# Daily development
pnpm playground   # (packages already built)
pnpm test:watch   # in a second terminal

# After changing any package source file
pnpm build        # rebuild, then refresh playground
```
