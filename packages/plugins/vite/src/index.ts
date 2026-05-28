// ============================================================
// @mastors/plugin-vite — Vite Plugin
// Mastors Intent-Based Styling Framework v0.1.0
//
// Integrates Mastors compilation into the Vite build pipeline.
// Scans source files for intent() calls, compiles CSS at
// build time, and injects it as a virtual module.
// ============================================================

import type { Plugin, HmrContext, ModuleNode } from "vite";
import type { MastorsConfig, IntentId } from "@mastors/types";
import { MastorsCompiler } from "@mastors/compiler";
import { configure } from "@mastors/api";

// ── Intent Extractor ─────────────────────────────────────────

const INTENT_REGEX = /intent\(\s*["'`]([a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*){0,3})["'`]/g;

/**
 * Extract all intent() calls from a source file string.
 */
function extractIntents(source: string): IntentId[] {
  const found = new Set<IntentId>();
  let match: RegExpExecArray | null;
  INTENT_REGEX.lastIndex = 0;
  while ((match = INTENT_REGEX.exec(source)) !== null) {
    if (match[1]) found.add(match[1] as IntentId);
  }
  return [...found];
}

// ── Virtual Module ────────────────────────────────────────────

const VIRTUAL_MODULE_ID = "virtual:mastors";
const RESOLVED_VIRTUAL_ID = "\0virtual:mastors";

// ── Plugin State ─────────────────────────────────────────────

interface PluginState {
  compiler: MastorsCompiler;
  collectedIntents: Set<IntentId>;
  generatedCss: string;
  tokenVars: string;
}

// ── mastorsPlugin() ───────────────────────────────────────────

export interface MastorsViteOptions {
  config: MastorsConfig;
  /** File extensions to scan for intent() calls (default: ts, tsx, js, jsx, vue, svelte) */
  include?: string[];
  /** Whether to emit a mastors-a11y.json manifest file (default: false in dev, true in build) */
  a11yManifest?: boolean;
}

/**
 * Vite plugin for Mastors. Add to your vite.config.ts.
 *
 * @example
 * // vite.config.ts
 * import { mastorsPlugin } from "@mastors/plugin-vite";
 * import { defineSchema } from "mastors";
 *
 * export default defineConfig({
 *   plugins: [
 *     mastorsPlugin({
 *       config: {
 *         schema: defineSchema({ tokens: "./tokens.json", vocabulary: {} }),
 *         a11yMode: "warn",
 *       },
 *     }),
 *   ],
 * });
 */
export function mastorsPlugin(options: MastorsViteOptions): Plugin {
  const state: PluginState = {
    compiler: new MastorsCompiler(options.config),
    collectedIntents: new Set(),
    generatedCss: "",
    tokenVars: "",
  };

  // Configure the global Mastors API instance
  configure(options.config);

  const extensions = options.include ?? ["ts", "tsx", "js", "jsx", "vue", "svelte"];
  const includePattern = new RegExp(`\\.(${extensions.join("|")})$`);

  function recompile(): void {
    const ids = [...state.collectedIntents];
    if (ids.length === 0) return;
    const output = state.compiler.compile(ids);
    state.generatedCss = output.css;
    state.tokenVars = output.tokenVars;
  }

  return {
    name: "mastors",
    enforce: "pre",

    // Virtual module resolution
    resolveId(id: string) {
      if (id === VIRTUAL_MODULE_ID) return RESOLVED_VIRTUAL_ID;
      return null;
    },

    // Serve virtual CSS module
    load(id: string) {
      if (id === RESOLVED_VIRTUAL_ID) {
        return `/* Mastors generated CSS */\n${state.tokenVars}\n\n${state.generatedCss}`;
      }
      return null;
    },

    // Scan transformed modules for intent() calls
    transform(code: string, id: string) {
      if (!includePattern.test(id)) return null;
      if (!code.includes("intent(")) return null;

      const found = extractIntents(code);
      let changed = false;
      for (const intentId of found) {
        if (!state.collectedIntents.has(intentId)) {
          state.collectedIntents.add(intentId);
          changed = true;
        }
      }
      if (changed) recompile();

      return null; // Don't transform the source
    },

    // HMR: invalidate virtual module when intents change
    handleHotUpdate(ctx: HmrContext): ModuleNode[] | undefined {
      if (!includePattern.test(ctx.file)) return undefined;

      Promise.resolve(ctx.read()).then((code: string) => {
        const found = extractIntents(code);
        let changed = false;
        for (const intentId of found) {
          if (!state.collectedIntents.has(intentId)) {
            state.collectedIntents.add(intentId);
            changed = true;
          }
        }
        if (changed) {
          recompile();
          const virtualModule = ctx.server.moduleGraph.getModuleById(RESOLVED_VIRTUAL_ID);
          if (virtualModule) {
            ctx.server.moduleGraph.invalidateModule(virtualModule);
            ctx.server.hot.send({ type: "full-reload" });
          }
        }
      });

      return undefined;
    },

    // Build: generate the final CSS file
    generateBundle() {
      if (state.generatedCss) {
        this.emitFile({
          type: "asset",
          fileName: "mastors.css",
          source: `${state.tokenVars}\n\n${state.generatedCss}`,
        });
      }
    },
  };
}

export default mastorsPlugin;
