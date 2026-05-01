# PR #43 — Strangler Migration Visual Validation Report

**PR:** https://github.com/Designed-By-Anthony/DBA/pull/43
**Preview:** https://copilot-execute-markdown-fil.dba-92r.pages.dev
**Devin session:** https://app.devin.ai/sessions/9fb295dc96704d31929391e8b3044526
**Recording:** https://app.devin.ai/attachments/d643bff0-509b-4c07-95e3-ff9bc93877bd/rec-cbbc622c-aa5b-4e3a-bd44-63234012c5df-edited.mp4

## TL;DR

3 of 4 acceptance criteria passed. **One ghost survived the hunt** — the Founding Partner pillar cards render against a slate-950 → slate-900 navy gradient (`rgba(11,17,30,0.92) → rgba(15,23,42,0.88)`), not pure Midnight `#0A0C10`. This isn't legacy Lighthouse blue (`#5b9cf8` / `#3b82f6`), but under your "zero legacy blue is visible" rule, it's still cool/blue-toned. Cards came over faithfully from `layout-shell.css` during Phase 4 — the navy values predate this PR — so this is a pre-existing design choice, not a migration regression. Flagging it because you specifically called out this section.

## Results

| # | Test | Result |
|---|------|--------|
| 1 | The Hero — Home Page hero + Bronze CTA buttons | PASSED |
| 2 | The Physics — Mobile-nav hamburger morphs to X smoothly | PASSED |
| 3 | The Drawer — Site Contact Drawer frosted glass | PASSED |
| 4 | The Ghost Hunt — Founding Partner + Premium Pitch (no blue) | **FAILED** (pillar cards navy) |

---

## 1 · The Hero — PASSED

Home page loads against pure Midnight `#0A0C10`. Primary CTA is a Bronze gradient pill (`linear-gradient(135deg, rgba(212,175,55,…), rgba(181,138,20,1))`); secondary CTA is the dark outline variant. Top-right nav also renders the Bronze "Audit My Site" pill (`btnPrimaryAudit` constant from `apps/web/src/design-system/buttons.ts`). Confirmed `dba-bronze-glow-pulse` animation around the hero CTA.

| Hero context | Hero CTAs zoomed |
|---|---|
| ![Hero on Midnight](https://app.devin.ai/attachments/07ebb4b6-1b33-4837-9112-5ead6b4700b5/screenshot_d0a0bb88fa6b499da057e77a10309e15.png) | ![Bronze CTAs](https://app.devin.ai/attachments/f37f3663-e9d4-4dd8-8f45-4a970e30cb35/screenshot_zoom_b8016eca5e584d619a2599bbcf9e0ccc.png) |
| Hero on `#0A0C10`, no blue tint, Bronze accents only | Audit My Site = Bronze pill; Contact us = dark outline; both rounded-full |

## 2 · The Physics — PASSED

At a 400×906 viewport, clicking `#hamburger-btn` opened the mobile-nav overlay. The 3 hamburger bars cleanly morphed into a single X — backed by the Tailwind variants `[&.active>span:nth-child(1)]:[transform:translate(0,0.4rem)_rotate(45deg)]` etc. on the button. Closing the overlay reversed the animation back to 3 bars without any visual pop or jump. Mobile nav slid in over a `#0A0C10`-tinted backdrop with frost.

| Mobile nav open | Hamburger → X (zoomed) |
|---|---|
| ![Mobile nav open](https://app.devin.ai/attachments/05b83eee-9fb4-4221-83d9-dd54f244cfbf/screenshot_152813f0a54c44358f48d7d584aac308.png) | ![Clean X icon](https://app.devin.ai/attachments/5fed2f08-f5fb-4ad3-af50-87324ae39e64/screenshot_zoom_57d5ddcc2f8d4273b297e8ab25005512.png) |
| Overlay visible with all primary nav links + Bronze "AUDIT MY SITE" | Hamburger bars rotated +45° / opacity-0 / −45° → clean X |

## 3 · The Drawer — PASSED

Clicked the vertical "CONTACT" rail tab (`SiteContactDrawer`); drawer slid out with the expected expensive frosted-glass aesthetic. The `INNER` constant in `SiteContactDrawer.tsx` resolves to `bg-[linear-gradient(165deg,rgba(28,22,12,0.55),rgba(10,12,16,0.72))] backdrop-blur-[16px] border-[rgba(212,175,55,0.18)]` — the Bronze hairline is visible at the panel edge, and the underlying body copy bleeds through softly on the right edge of the drawer (proof the backdrop-blur is active, not an opaque panel). The "Send Message" CTA is the Bronze `btnPrimary` pill.

![Frosted contact drawer](https://app.devin.ai/attachments/063596b7-4128-4d2e-af52-212efc2efa78/screenshot_zoom_8f1940cf2ba74c9e86e9e3b3e377500b.png)

## 4 · The Ghost Hunt — FAILED (pillar cards navy)

### Premium Pitch — clean

The Premium Pitch strip ("What you get here / Fast, considered, and honest about price.") renders against pure Midnight with **only** Bronze/cream accents on the FAST / STYLISH / HIGH-RANKING / FAIR PRICE eyebrows. No blue gradient, no blue dividers, no blue accents.

![Premium Pitch — Bronze eyebrows on Midnight](https://app.devin.ai/attachments/e8223ca0-04fe-48f6-8892-3a3d89c891f4/screenshot_zoom_0f37e042c1b74462a02dbece5f463b37.png)

### Founding Partner — pillar cards have navy gradient

The "LAUNCH ALLOCATION" and "AFTER LAUNCH" pillar cards in the Founding Partner section have a clearly cool/navy background gradient. Source confirms it: `apps/web/src/components/marketing/FoundingPartnerSection.tsx:18` defines `PILLAR_BASE` as

```
bg-[linear-gradient(165deg,rgba(11,17,30,0.92)_0%,rgba(15,23,42,0.88)_100%)]
```

`rgba(11,17,30)` ≈ slate-950, `rgba(15,23,42)` ≈ slate-900 — both noticeably bluer than `#0A0C10` Midnight `(10,12,16)`. The bronze hairline shimmer on top of each card is correct, but the card body itself reads as navy, not Midnight.

![Founding Partner pillar cards — navy gradient](https://app.devin.ai/attachments/9ed07295-8761-4b39-8d72-bf8f91aab1b6/screenshot_zoom_c4b324ce12874e04985ab1dd0c948bdd.png)

**Origin of these values:** they came over faithfully from the original `layout-shell.css` `.founding-pillar` rule during Phase 4. So this is **not a regression introduced by this PR** — the slate values were the design's prior baseline. But under your "zero legacy blue" instruction, this still reads as a ghost.

**Recommended fix (one-line, low risk):** change `PILLAR_BASE` to use Midnight + Bronze:

```
bg-[linear-gradient(165deg,rgba(10,12,16,0.92)_0%,rgba(20,15,8,0.88)_100%)]
```

That would harmonize the cards with the rest of the section while preserving the elevated/glassy feel. Happy to push this as a follow-up commit on PR #43, or hold off until Phase 5.5 — your call.

## Regression spot checks (label clearly)

- **Regression — Tools page (`/tools`):** Previously verified clean Bronze translation by Copilot during Phase 2; not re-tested in this pass.
- **Regression — Footer:** Brief glance during scroll showed Bronze hairline + muted slate copy as designed.

## What this recording would look like if the change were broken

- If `buttons.ts` constants were missing/misapplied, hero CTAs would render as default browser buttons (square corners, no Bronze gradient).
- If the `[&.active>span]` arbitrary variants didn't compile in Tailwind v4, the hamburger would stay flat instead of morphing to X.
- If `SiteContactDrawer.INNER` lost `backdrop-blur`, the drawer would render opaque against the body — the bleed-through I observed wouldn't exist.
- If Phase 5b's blue purge had missed any literal `#5b9cf8` / `#3b82f6` / `rgba(91,156,248,X)`, atmospheric body gradients or eyebrows would show that distinct azure/cobalt tint. None observed; the only cool-toned regression is the slate-tinted founding-pillar cards (a pre-existing design choice, not a missed purge target).
