# Premium Aesthetic Integration

**Goal:** Transform the Designed by Anthony site into a high‑end, Manhattan‑style digital experience that feels like a million‑dollar agency. This includes adding a striking NYC skyline hero image, a premium client‑logos carousel, an NYC map illustration, glass‑morphism cards, subtle micro‑animations, and refined typography.

## User Review Required

> [!IMPORTANT]
> The plan introduces new visual sections (hero background, carousel, map) and updates global styles. Please confirm you are happy with the placement of these elements and the overall design direction before we proceed.

## Proposed Changes

---
### Layout Enhancements (global)
- **[MODIFY] [Layout.astro](file:///Users/anthonyjones/Web%20Design/Designed%20by%20Anthony/src/layouts/Layout.astro)**
  - Add a `<style>` block with CSS variables for glass‑morphism, subtle shadows, and transition utilities.
  - Include a global `@import` for a premium Google Font (e.g., "Inter" with weights 400‑800).
  - Insert a `<script>` to initialize a simple IntersectionObserver‑based reveal animation for elements with class `reveal` (already present, but will be enhanced with staggered delays).

---
### Homepage Hero Section
- **[MODIFY] [index.astro](file:///Users/anthonyjones/Web%20Design/Designed%20by%20Anthony/src/pages/index.astro)**
  - Replace the gradient background with `hero_nyc.png` as a full‑width background image.
  - Add an overlay `linear-gradient(rgba(0,0,0,0.45), rgba(0,0,0,0.45))` to keep text readable.
  - Apply glass‑morphism to the hero headline container.
  - Add a subtle zoom‑in micro‑animation on page load.

---
### Client Logos Carousel
- **[MODIFY] [index.astro](file:///Users/anthonyjones/Web%20Design/Designed%20by%20Anthony/src/pages/index.astro)**
  - Insert a new section after the metrics block:
    ```html
    <section class="clients-section" aria-label="Trusted by Top NYC Brands">
      <h2 class="section-eyebrow">Our Clients</h2>
      <div class="carousel-wrapper reveal">
        <img src="/images/client_logos.png" alt="Logos of premium NYC brands" class="client-carousel" loading="lazy" />
      </div>
    </section>
    ```
  - Add CSS for a smooth horizontal scroll on hover and a fade‑in animation.

---
### NYC Map Illustration
- **[MODIFY] [ouredge.astro](file:///Users/anthonyjones/Web%20Design/Designed%20by%20Anthony/src/pages/ouredge.astro)**
  - Add a new subsection titled “Our Reach” with the `nyc_map.png` illustration.
  - Use a glass‑morphism card to frame the map and include a short copy about serving the NYC metro area.

---
### Glass‑Morphism Card Component (new reusable component)
- **[NEW] [components/GlassCard.astro](file:///Users/anthonyjones/Web%20Design/Designed%20by%20Anthony/src/components/GlassCard.astro)**
  - Props: `title`, `subtitle`, `children`.
  - Styles: backdrop‑filter blur, semi‑transparent background, subtle border, hover lift.
  - This component will be used for the new map card and can replace existing card styles on services, portfolio, etc.

---
### Typography & Color Palette Refresh
- **[MODIFY] [src/styles/variables.css]** (create if missing)
  - Define `--font-primary: 'Inter', sans-serif;`
  - Update primary colors to a dark‑luxury palette (midnight navy, electric blue accents, muted gold for highlights).
  - Ensure all headings use the new font and weight hierarchy.

---
### Micro‑Animations
- Enhance the existing reveal script to include staggered delays based on `data-index` attributes.
- Add a subtle pulse animation to the availability badge on the contact page.

---
### SEO & Accessibility
- Verify all new images have descriptive `alt` text.
- Ensure each new section has a unique `<h2>` and proper ARIA labels.

## Open Questions

> [!WARNING]
> 1. **Placement of the client‑logos carousel** – should it appear on the homepage only, or also on the Services page?
> 2. **Map section title** – do you prefer “Our Reach” or “Service Area”?
> 3. **Font choice** – we plan to use Inter. If you have a different premium font in mind, let us know.

## Verification Plan

### Automated Tests
- Run `npm run build` and `npm run preview` to ensure the site compiles without errors.
- Use Lighthouse CI to verify the mobile performance stays > 90 after asset additions.

### Manual Verification
- Visually inspect the live dev server (`http://localhost:4321`) for:
  - Hero image loading correctly and text readability.
  - Carousel scrolling smoothly on hover.
  - Map card rendering with glass‑morphism effect.
  - Consistent typography across pages.
- Check console for any CSP or script errors.

---
*Implementation will be tracked in `task.md`.*
