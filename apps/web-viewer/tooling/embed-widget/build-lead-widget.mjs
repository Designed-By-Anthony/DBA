#!/usr/bin/env node
/**
 * Bundles `widget-src/lead-form.ts` → `public/widgets/lead-form.js` (IIFE, minified).
 */
import * as esbuild from "esbuild";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

await esbuild.build({
  entryPoints: [join(root, "widget-src/lead-form.ts")],
  outfile: join(root, "public/widgets/lead-form.js"),
  bundle: true,
  platform: "browser",
  format: "iife",
  target: ["es2020"],
  minify: true,
  legalComments: "none",
});

console.log("Built public/widgets/lead-form.js");
