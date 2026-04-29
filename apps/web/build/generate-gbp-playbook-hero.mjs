/**
 * Wide blog / OG hero for the GBP 2026 CNY playbook (vector → PNG via sharp).
 * Replace `public/images/gbp_2026_cny_playbook_hero.png` with your final export
 * when ready — same path keeps `blogPosts` unchanged.
 *
 * Run: node build/generate-gbp-playbook-hero.mjs
 */
import { mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const outPath = join(root, "public/images/gbp_2026_cny_playbook_hero.png");

const W = 1920;
const H = 960;

const navy = "#0c1220";
const panel = "#111b2e";
const orange = "#f97316";
const green = "#22c55e";
const blue = "#38bdf8";
const cream = "#f8fafc";
const muted = "#94a3b8";

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#070b12"/>
      <stop offset="50%" style="stop-color:${navy}"/>
      <stop offset="100%" style="stop-color:#050810"/>
    </linearGradient>
    <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.45"/>
    </filter>
  </defs>
  <rect width="100%" height="100%" fill="url(#bg)"/>

  <!-- Decorative blueprint grid -->
  <g opacity="0.12" stroke="${blue}" stroke-width="1" fill="none">
    ${Array.from({ length: 25 }, (_, i) => {
			const x = 32 + i * 76;
			return `<line x1="${x}" y1="24" x2="${x}" y2="${H - 24}"/>`;
		}).join("")}
    ${Array.from({ length: 13 }, (_, i) => {
			const y = 28 + i * 76;
			return `<line x1="24" y1="${y}" x2="${W - 24}" y2="${y}"/>`;
		}).join("")}
  </g>

  <!-- Q1: AI Calling -->
  <g filter="url(#shadow)">
    <rect x="36" y="36" width="600" height="400" rx="16" fill="${panel}" stroke="rgba(56,189,248,0.25)" stroke-width="1"/>
  </g>
  <text x="56" y="78" fill="${orange}" font-family="system-ui, sans-serif" font-size="22" font-weight="800">1. AI CALLING</text>
  <rect x="72" y="110" width="120" height="200" rx="14" fill="#1e293b" stroke="rgba(248,250,252,0.15)"/>
  <rect x="88" y="128" width="88" height="18" rx="4" fill="${muted}"/>
  <circle cx="132" cy="200" r="28" fill="${green}" opacity="0.9"/>
  <text x="108" y="208" fill="#052e16" font-family="system-ui, sans-serif" font-size="11" font-weight="800">GBP</text>
  <rect x="88" y="248" width="88" height="26" rx="6" fill="${green}"/>
  <text x="96" y="266" fill="#052e16" font-family="system-ui, sans-serif" font-size="10" font-weight="800">BOOKING OK</text>
  <rect x="220" y="140" width="380" height="72" rx="10" fill="rgba(15,23,42,0.9)" stroke="rgba(248,250,252,0.1)"/>
  <text x="236" y="172" fill="${cream}" font-family="system-ui, sans-serif" font-size="15" font-weight="600">Google AI took the lead — you confirm the job.</text>
  <text x="236" y="198" fill="${muted}" font-family="system-ui, sans-serif" font-size="13">CNY plumbers &amp; HVAC: answer-ready profile + site alignment.</text>

  <!-- Q2: Freshness -->
  <g filter="url(#shadow)">
    <rect x="1284" y="36" width="600" height="400" rx="16" fill="${panel}" stroke="rgba(249,115,22,0.28)" stroke-width="1"/>
  </g>
  <text x="1304" y="78" fill="${orange}" font-family="system-ui, sans-serif" font-size="22" font-weight="800">2. FRESHNESS PRESSURE</text>
  <rect x="1310" y="110" width="200" height="56" rx="10" fill="#1e293b" stroke="rgba(248,250,252,0.12)"/>
  <text x="1326" y="146" fill="${cream}" font-family="system-ui, sans-serif" font-size="14" font-weight="700">RECENT POSTS</text>
  <circle cx="1560" cy="138" r="22" fill="none" stroke="${orange}" stroke-width="3"/>
  <text x="1548" y="146" fill="${orange}" font-family="system-ui, sans-serif" font-size="11" font-weight="800">NEW</text>
  <text x="1310" y="210" fill="${green}" font-family="system-ui, sans-serif" font-size="15" font-weight="700">LAST POST: 1 HR AGO (PHOTO) → ranking boost</text>
  <rect x="1310" y="232" width="140" height="36" rx="8" fill="rgba(56,189,248,0.2)" stroke="${blue}"/>
  <text x="1324" y="256" fill="${blue}" font-family="system-ui, sans-serif" font-size="12" font-weight="700">UPLOAD PHOTO</text>
  <rect x="1464" y="232" width="130" height="36" rx="8" fill="rgba(249,115,22,0.2)" stroke="${orange}"/>
  <text x="1478" y="256" fill="${orange}" font-family="system-ui, sans-serif" font-size="12" font-weight="700">POST UPDATE</text>

  <!-- Center: CNY map zone -->
  <g filter="url(#shadow)">
    <rect x="660" y="120" width="600" height="720" rx="20" fill="${panel}" stroke="rgba(56,189,248,0.35)" stroke-width="1.5"/>
  </g>
  <text x="960" y="168" text-anchor="middle" fill="${cream}" font-family="system-ui, sans-serif" font-size="13" font-weight="700" letter-spacing="0.12em">CENTRAL NEW YORK</text>
  <circle cx="960" cy="480" r="200" fill="none" stroke="${blue}" stroke-width="3" opacity="0.55"/>
  <circle cx="960" cy="480" r="140" fill="rgba(56,189,248,0.12)" stroke="${blue}" stroke-width="2" opacity="0.9"/>
  <text x="960" y="472" text-anchor="middle" fill="${blue}" font-family="system-ui, sans-serif" font-size="18" font-weight="800">YOUR SERVICE AREA</text>
  <text x="960" y="508" text-anchor="middle" fill="${muted}" font-family="system-ui, sans-serif" font-size="14">Syracuse · Utica · Rome · Dewitt · Liverpool</text>
  <rect x="720" y="560" width="480" height="44" rx="10" fill="#0f172a" stroke="rgba(248,250,252,0.12)"/>
  <text x="960" y="588" text-anchor="middle" fill="${cream}" font-family="system-ui, sans-serif" font-size="15" font-weight="600">PLUMBER NEAR SYRACUSE, NY</text>
  <text x="960" y="640" text-anchor="middle" fill="${muted}" font-family="system-ui, sans-serif" font-size="13">Map Pack + Ask Maps + GBP — one coherent story</text>

  <!-- Q3: Visual ranking -->
  <g filter="url(#shadow)">
    <rect x="36" y="524" width="600" height="400" rx="16" fill="${panel}" stroke="rgba(34,197,94,0.25)" stroke-width="1"/>
  </g>
  <text x="56" y="566" fill="${orange}" font-family="system-ui, sans-serif" font-size="22" font-weight="800">3. VISUAL RANKING</text>
  <rect x="56" y="596" width="260" height="140" rx="12" fill="#1e293b" stroke="rgba(239,68,68,0.4)"/>
  <text x="72" y="628" fill="#fca5a5" font-family="system-ui, sans-serif" font-size="13" font-weight="800">BAD VISUALS</text>
  <text x="72" y="658" fill="${muted}" font-family="system-ui, sans-serif" font-size="12">Blurry stock · grainy</text>
  <rect x="340" y="596" width="276" height="140" rx="12" fill="#1e293b" stroke="rgba(34,197,94,0.45)"/>
  <text x="356" y="628" fill="#86efac" font-family="system-ui, sans-serif" font-size="13" font-weight="800">GOOD VISUALS</text>
  <text x="356" y="658" fill="${muted}" font-family="system-ui, sans-serif" font-size="12">Local installs · hi-res proof</text>
  <text x="56" y="780" fill="${cream}" font-family="system-ui, sans-serif" font-size="20" font-weight="800">VISUALS = CONVERSIONS</text>
  <text x="56" y="812" fill="${muted}" font-family="system-ui, sans-serif" font-size="13">AI reads photo quality + captions — match reality.</text>

  <!-- Q4: Ask Maps -->
  <g filter="url(#shadow)">
    <rect x="1284" y="524" width="600" height="400" rx="16" fill="${panel}" stroke="rgba(56,189,248,0.25)" stroke-width="1"/>
  </g>
  <text x="1304" y="566" fill="${orange}" font-family="system-ui, sans-serif" font-size="22" font-weight="800">4. ASK MAPS (AI)</text>
  <rect x="1310" y="596" width="200" height="40" rx="10" fill="rgba(56,189,248,0.15)" stroke="${blue}"/>
  <text x="1340" y="622" fill="${blue}" font-family="system-ui, sans-serif" font-size="14" font-weight="800">ASK MAPS</text>
  <rect x="1310" y="652" width="548" height="72" rx="12" fill="#0f172a" stroke="rgba(248,250,252,0.1)"/>
  <text x="1326" y="682" fill="${muted}" font-family="system-ui, sans-serif" font-size="13">Which CNY HVAC has reviews for fast water heater replace in Dewitt?</text>
  <rect x="1310" y="738" width="548" height="72" rx="12" fill="rgba(34,197,94,0.12)" stroke="${green}"/>
  <text x="1326" y="770" fill="${cream}" font-family="system-ui, sans-serif" font-size="13">Best fit from fresh reviews + visuals + location signals.</text>
  <text x="1326" y="794" fill="${muted}" font-family="system-ui, sans-serif" font-size="12">Conversational search replaces old Q&amp;A patterns.</text>

  <!-- Title band -->
  <rect x="0" y="0" width="${W}" height="72" fill="rgba(7,11,18,0.92)" stroke="none"/>
  <text x="960" y="48" text-anchor="middle" fill="${orange}" font-family="system-ui, sans-serif" font-size="26" font-weight="900" letter-spacing="0.04em">GOOGLE BUSINESS PROFILE: THE 2026 PLAYBOOK</text>
  <text x="960" y="72" text-anchor="middle" fill="${muted}" font-family="system-ui, sans-serif" font-size="14" font-weight="600">CNY SERVICE BUSINESSES — AI calling · freshness · visuals · Ask Maps</text>
</svg>`;

await mkdir(dirname(outPath), { recursive: true });
await sharp(Buffer.from(svg)).png({ compressionLevel: 9 }).toFile(outPath);
console.info("Wrote", outPath);
