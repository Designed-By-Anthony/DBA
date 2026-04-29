/**
 * Renders a unique blog hero PNG from inline SVG (vector → raster via sharp).
 * Run: node build/generate-gbp-playbook-cover.mjs
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "public/images/gbp_2026_cny_playbook_cover.png");

const W = 1024;
const H = 1024;

const vLines = Array.from({ length: 17 }, (_, i) => {
	const x = 48 + i * 58;
	return `<line x1="${x}" y1="64" x2="${x}" y2="${H - 64}"/>`;
}).join("");

const hLines = Array.from({ length: 15 }, (_, i) => {
	const y = 72 + i * 58;
	return `<line x1="56" y1="${y}" x2="${W - 56}" y2="${y}"/>`;
}).join("");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#0a0c10"/>
      <stop offset="45%" style="stop-color:#0f1218"/>
      <stop offset="100%" style="stop-color:#06080d"/>
    </linearGradient>
    <radialGradient id="glow" cx="72%" cy="28%" r="55%">
      <stop offset="0%" style="stop-color:#5b9cf8;stop-opacity:0.35"/>
      <stop offset="55%" style="stop-color:#5b9cf8;stop-opacity:0.08"/>
      <stop offset="100%" style="stop-color:#5b9cf8;stop-opacity:0"/>
    </radialGradient>
    <radialGradient id="brass" cx="50%" cy="50%" r="50%">
      <stop offset="0%" style="stop-color:#e8d4a8"/>
      <stop offset="100%" style="stop-color:#c9a86c"/>
    </radialGradient>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>
  <rect width="100%" height="100%" fill="url(#glow)"/>

  <g opacity="0.14" stroke="#93c5fd" stroke-width="1" fill="none">
    ${vLines}
    ${hLines}
  </g>

  <path d="M 120 780 Q 340 620 520 700 T 900 560" fill="none" stroke="rgba(91,156,248,0.22)" stroke-width="3" stroke-linecap="round"/>
  <path d="M 140 820 Q 400 880 620 740 T 940 680" fill="none" stroke="rgba(201,168,108,0.18)" stroke-width="2.5" stroke-linecap="round"/>

  <g transform="translate(640, 340)" opacity="0.9">
    <circle r="180" fill="none" stroke="#5b9cf8" stroke-width="1.5" opacity="0.12"/>
    <circle r="130" fill="none" stroke="#5b9cf8" stroke-width="1.5" opacity="0.18"/>
    <circle r="82" fill="none" stroke="#5b9cf8" stroke-width="2" opacity="0.28"/>
  </g>

  <g transform="translate(512, 420)">
    <ellipse cx="0" cy="88" rx="36" ry="10" fill="#000" opacity="0.35"/>
    <path d="M 0,-112 C -52,-112 -88,-76 -88,-28 C -88,28 0,112 0,112 C 0,112 88,28 88,-28 C 88,-76 52,-112 0,-112 Z" fill="url(#brass)" stroke="rgba(255,252,245,0.35)" stroke-width="2"/>
    <circle cy="-36" r="28" fill="#0f1218" stroke="rgba(91,156,248,0.5)" stroke-width="2"/>
    <circle cy="-36" r="12" fill="#5b9cf8" opacity="0.85"/>
  </g>

  <g transform="translate(300, 520)" opacity="0.92">
    <path d="M 0,-56 C -26,-56 -44,-38 -44,-14 C -44,10 0,56 0,56 C 0,56 44,10 44,-14 C 44,-38 26,-56 0,-56 Z" fill="#131a24" stroke="rgba(147,197,253,0.35)" stroke-width="1.5"/>
    <circle cy="-18" r="10" fill="#5b9cf8" opacity="0.55"/>
  </g>
  <g transform="translate(720, 560)" opacity="0.88">
    <path d="M 0,-52 C -24,-52 -40,-36 -40,-12 C -40,12 0,52 0,52 C 0,52 40,12 40,-12 C 40,-36 24,-52 0,-52 Z" fill="#131a24" stroke="rgba(201,168,108,0.4)" stroke-width="1.5"/>
    <circle cy="-16" r="9" fill="#c9a86c" opacity="0.65"/>
  </g>

  <rect x="48" y="48" width="120" height="4" rx="2" fill="#c9a86c" opacity="0.85"/>
  <rect x="${W - 168}" y="${H - 52}" width="120" height="4" rx="2" fill="#5b9cf8" opacity="0.7"/>
</svg>`;

await mkdir(join(root, "public/images"), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);

console.info("Wrote", outPath);
