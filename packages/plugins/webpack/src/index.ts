// ============================================================
// @mastors/plugin-webpack — webpack Plugin
// Mastors Intent-Based Styling Framework v0.1.0
//
// Integrates Mastors compilation into the webpack build pipeline.
// Emits mastors.css as a compiled asset.
// ============================================================

import type { Compiler, Compilation, WebpackPluginInstance } from "webpack";
import type { MastorsConfig, IntentId } from "@mastors/types";
import { MastorsCompiler } from "@mastors/compiler";
import { configure } from "@mastors/api";

// ── Intent Extractor ─────────────────────────────────────────

const INTENT_REGEX = /intent\(\s*["'`]([a-z][a-z0-9]*(?:\.[a-z][a-z0-9-]*){0,3})["'`]/g;

function extractIntents(source: string): IntentId[] {
  const found = new Set<IntentId>();
  let match: RegExpExecArray | null;
  INTENT_REGEX.lastIndex = 0;
  while ((match = INTENT_REGEX.exec(source)) !== null) {
    if (match[1]) found.add(match[1] as IntentId);
  }
  return [...found];
}

// ── MastorsWebpackPlugin ──────────────────────────────────────

export interface MastorsWebpackOptions {
  config: MastorsConfig;
  /** Output CSS filename (default: "mastors.css") */
  filename?: string;
}

/**
 * webpack plugin for Mastors.
 *
 * @example
 * // webpack.config.js
 * const { MastorsWebpackPlugin } = require("@mastors/plugin-webpack");
 *
 * module.exports = {
 *   plugins: [
 *     new MastorsWebpackPlugin({
 *       config: {
 *         schema: require("./mastors.config").default,
 *         a11yMode: "warn",
 *       },
 *     }),
 *   ],
 * };
 */
export class MastorsWebpackPlugin implements WebpackPluginInstance {
  private options: MastorsWebpackOptions;
  private compiler: MastorsCompiler;
  private collectedIntents = new Set<IntentId>();
  private filename: string;

  constructor(options: MastorsWebpackOptions) {
    this.options = options;
    this.compiler = new MastorsCompiler(options.config);
    this.filename = options.filename ?? "mastors.css";
    configure(options.config);
  }

  apply(webpackCompiler: Compiler): void {
    const pluginName = "MastorsWebpackPlugin";
    const { webpack } = webpackCompiler;
    const { Compilation, sources } = webpack;

    webpackCompiler.hooks.compilation.tap(pluginName, (compilation: Compilation) => {
      // Scan each module's source for intent() calls
      compilation.hooks.succeedModule.tap(pluginName, (mod) => {
        const source = (mod as unknown as { _source?: { source(): string } })._source?.source();
        if (typeof source === "string" && source.includes("intent(")) {
          const found = extractIntents(source);
          for (const id of found) this.collectedIntents.add(id);
        }
      });

      // Emit the compiled CSS asset
      compilation.hooks.processAssets.tap(
        {
          name: pluginName,
          stage: Compilation.PROCESS_ASSETS_STAGE_SUMMARIZE,
        },
        () => {
          const ids = [...this.collectedIntents];
          if (ids.length === 0) return;

          const output = this.compiler.compile(ids);
          const css = `${output.tokenVars}\n\n${output.css}`;

          compilation.emitAsset(this.filename, new sources.RawSource(css));
        }
      );
    });
  }
}

export default MastorsWebpackPlugin;
