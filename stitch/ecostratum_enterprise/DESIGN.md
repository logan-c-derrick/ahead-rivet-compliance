```markdown
# Design System Specification: Environmental Compliance & Data Integrity

## 1. Overview & Creative North Star: "The Architectural Ledger"
In the world of environmental compliance, data isn't just numbers; it’s a record of responsibility. This design system moves away from the "cluttered dashboard" trope and toward **The Architectural Ledger**. 

Our North Star is a high-end editorial approach to enterprise software. We reject the rigid, "boxed-in" feeling of traditional SaaS. Instead, we embrace **Intentional Asymmetry** and **Tonal Depth**. By utilizing wide horizontal spans, staggered content blocks, and sophisticated layering, we create a workspace that feels authoritative yet breathable—mimicking the layout of a premium architectural journal. 

We don't use lines to separate ideas; we use space and light.

---

## 2. Colors: Tonal Authority
Our palette is rooted in deep, lithic blues and slates. It is designed to recede, allowing the critical status colors to communicate urgency without visual noise.

### The "No-Line" Rule
**Borders are a failure of hierarchy.** Within this system, 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined solely through background color shifts. For example, a `surface_container_low` section sitting on a `surface` background provides all the definition a professional eye needs.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers—like stacked sheets of vellum.
*   **Base Layer:** `surface` (#f8f9ff)
*   **Secondary Content:** `surface_container_low` (#eff4ff)
*   **Primary Interactive Cards:** `surface_container_lowest` (#ffffff)
*   **Active/Elevated Elements:** `surface_container_highest` (#d3e4fe)

### The Glass & Gradient Rule
To prevent the UI from feeling "flat," use **Glassmorphism** for floating elements (like side-drawers or navigation overlays). Use `surface_container` with a `backdrop-blur` of 12px and 60% opacity. 
*   **Signature Texture:** Main CTAs should utilize a subtle linear gradient from `primary` (#003358) to `primary_container` (#004a7c) at a 135-degree angle. This adds "soul" and a tactile, pressed-ink quality.

---

## 3. Typography: Editorial Clarity
We pair two distinct typefaces to balance character with extreme legibility.

*   **Display & Headlines (Manrope):** A modern geometric sans-serif with an open aperture. Used for `display-lg` through `headline-sm`. Its wide stance conveys transparency and institutional strength.
*   **Data & Body (Inter):** The workhorse. Used for `title`, `body`, and `label` scales. Inter is chosen specifically for its tall x-height, which ensures that dense data tables and environmental metrics remain legible even at `body-sm` (0.75rem).

**Editorial Tip:** Use `display-md` for high-level compliance percentages. Surround large typography with significant whitespace (Value `16` or `20` from the spacing scale) to create a "Gallery" effect for critical data.

---

## 4. Elevation & Depth: Tonal Layering
We convey importance through **Tonal Layering** rather than traditional drop shadows.

*   **The Layering Principle:** Place a `surface_container_lowest` card on a `surface_container_low` section. This creates a soft, natural lift that mimics natural light hitting a raised surface.
*   **Ambient Shadows:** If a floating state is required (e.g., a Modal), use an extra-diffused shadow: `box-shadow: 0 20px 40px rgba(11, 28, 48, 0.06)`. The shadow color is a tinted version of `on_surface`, not black.
*   **The Ghost Border:** If a boundary is required for accessibility in dense forms, use the `outline_variant` token at **20% opacity**. Never use 100% opaque lines.

---

## 5. Components: The Refined Toolkit

### Buttons & Interaction
*   **Primary:** Gradient of `primary` to `primary_container` with `rounded-md` (0.375rem). Text is `on_primary`.
*   **Secondary:** `surface_container_high` background with `on_secondary_container` text. No border.
*   **Tertiary/Ghost:** No background. Use `primary` for text. High emphasis on hover states using `surface_container_low`.

### Data Tables & Lists
*   **No Dividers:** Forbid the use of horizontal rules between rows. Instead, use a `2.5` (0.5rem) spacing gap and a subtle background shift (`surface_container_low`) on hover.
*   **Compliance Indicators:** Use `tertiary_fixed_dim` (#68dba9) for compliant, `secondary_fixed_dim` (#b9c7df) for pending, and `error` (#ba1a1a) for non-compliant. These should be rendered as small, high-contrast "Pills" using the `full` roundedness scale.

### Structured Forms
*   **Input Fields:** Use `surface_container_lowest` with a `ghost border`. Labels use `label-md` in `on_surface_variant`. 
*   **Focus States:** Transition the ghost border to `primary` with a 2px outer glow of `primary_fixed` at 40% opacity.

### Compliance Dashboards
*   **The Progress Ring:** Use `tertiary` for successful compliance tracks.
*   **The Risk Matrix:** Use a nested grid where each "cell" is a tonal shift, avoiding harsh lines.

---

## 6. Do’s and Don'ts

### Do:
*   **Do** use asymmetrical layouts (e.g., a wide 8-column data view next to a 3-column narrow insight panel).
*   **Do** prioritize vertical whitespace. If the data is dense, the margins must be generous.
*   **Do** use `surface_bright` to highlight "New" or "Unread" compliance alerts.

### Don't:
*   **Don't** use 1px black or grey borders. They "trap" the data and make the interface feel dated.
*   **Don't** use standard "Drop Shadows" with high opacity. They muddy the clean, slate-blue aesthetic.
*   **Don't** use pure black (#000000) for text. Always use `on_surface` (#0b1c30) to maintain tonal harmony with the deep blues.
*   **Don't** use "Alert Yellow" for pending status. Use our sophisticated `secondary_fixed_dim` slate-blue to keep the user calm while they investigate.

---

**Director’s Note:** Remember, our goal is to make the compliance officer feel like they are looking at a masterfully curated report, not a spreadsheet. Use the spacing scale religiously—when in doubt, add more air.```