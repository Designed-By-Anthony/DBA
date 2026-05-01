/**
 * Rasterizes `public/logos/anthony_master_wordmark.svg` to PNG for both web and admin.
 * Run from repo root: `bun run --cwd apps/web generate:master-wordmark`
 *
 * When design drops in a final isolated PNG from image_12.png, replace
 * `anthony_master_wordmark.png` in both apps and optionally retire this script.
 */
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const webRoot = join(__dirname, "..");
const svgPath = join(webRoot, "public/logos/anthony_master_wordmark.svg");
const svg = readFileSync(svgPath);

const WEB_PNG = join(webRoot, "public/logos/anthony_master_wordmark.png");
const ADMIN_DIR = join(webRoot, "../admin/public/logos");
const ADMIN_PNG = join(ADMIN_DIR, "anthony_master_wordmark.png");

mkdirSync(dirname(WEB_PNG), { recursive: true });
mkdirSync(ADMIN_DIR, { recursive: true });

const pngBuf = await sharp(svg)
	.resize({ width: 2400 })
	.png({ compressionLevel: 9 })
	.toBuffer();

writeFileSync(WEB_PNG, pngBuf);
writeFileSync(ADMIN_PNG, pngBuf);
console.log("Wrote:", WEB_PNG, ADMIN_PNG);
