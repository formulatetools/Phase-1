# Landing Page Audit Spec

**Date:** 2026-03-01
**Scope:** Full review of `/src/app/page.tsx` and all `src/components/marketing/*` components
**Status:** Review complete — ready for implementation

---

## Current Section Order

1. Nav (`LandingNav`)
2. Hero — headline, sub-copy, primary CTA ("Get Started Free"), secondary CTA ("See it in action")
3. Interactive Preview (`WorksheetPreview`) — embedded 7-column thought record
4. AI Showcase (`AIGenerateTeaser`) — text input + example chips + 3 feature cards
5. How It Works — 3-step: Assign → Complete → Review
6. Client Experience Demo (`ClientExperienceDemo`) — 3 cards linking to `/hw/demo/:slug`
7. Features — 6 feature cards
8. Pricing (`PricingTable`) — 4 tiers with monthly/annual toggle
9. Final CTA — "Ready to ditch the photocopier?"
10. Footer (`MarketingFooter`)

---

## 1. Best Practices

### What's working

- Server component page with client components only where interactivity is needed — good code splitting.
- Metadata is thorough: `<title>`, `description`, Open Graph, Twitter card, canonical URL.
- Sticky nav with `backdrop-blur-sm` and `z-50`.
- `aria-label` on the mobile hamburger button.
- `aria-hidden` on decorative SVGs in the AI section.
- Semantic HTML throughout: `<nav>`, `<section>`, `<footer>`, heading hierarchy `<h1>`–`<h3>`.
- Responsive: mobile hamburger menu, `sm:` / `lg:` breakpoints on all sections.

### Issues

| #  | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| 1  | HIGH     | **No social proof or trust signals anywhere.** No testimonials, user count, professional body logos, or credibility indicators. For a clinical tool, trust is the #1 conversion driver. | Add a social proof strip after the hero and a testimonials section before pricing. |
| 2  | MEDIUM   | **Missing `aria-hidden` on decorative SVGs** in How It Works (3 icons), Features grid (6 icons), and Client Experience Demo icons. Only the AI section has them consistently. | Add `aria-hidden="true"` to all decorative SVGs. |
| 3  | MEDIUM   | **No skip-to-content link** for keyboard and screen-reader users. | Add a visually-hidden skip link as the first focusable element. |
| 4  | LOW      | **Mobile nav doesn't trap focus.** Open hamburger allows tab focus to escape behind the overlay. No `aria-expanded` attribute on the toggle button. | Add `aria-expanded={open}` and consider focus trapping. |
| 5  | LOW      | **Hero "See it in action" uses a raw `<a>` tag** instead of `<Link>` — fine for same-page anchors but inconsistent with the rest of the codebase. | Keep as `<a>` (correct for `#hash`) but document the reasoning. |
| 6  | LOW      | **No lazy loading strategy** for heavy below-fold client components (`WorksheetPreview`, `AIGenerateTeaser`). They hydrate eagerly. | Consider `next/dynamic` with `ssr: false` or intersection-observer lazy hydration. |

---

## 2. Customer Engagement & Funnel

### Issues

| #  | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| 7  | HIGH     | **Too many sections before pricing.** Visitor scrolls through 6 sections before seeing a price. SaaS best practice is 3–4 sections max before pricing. | Reorder: Hero → Social Proof → Demo → How It Works → Pricing → AI/Features → CTA. |
| 8  | HIGH     | **Two overlapping demo sections.** "See what your clients see" (WorksheetPreview) and "See the client experience" (ClientExperienceDemo) serve the same purpose. Both show what clients see. Creates decision fatigue and page bloat. | **Merge into one section** — see [Design Change](#design-change-tabbed-client-journey) below. |
| 9  | HIGH     | **No social proof anywhere in the funnel.** No "X therapists use Formulate", no testimonials, no professional body mentions. Biggest single gap for conversion. | Add social proof strip (logos/count) after hero and 2–3 testimonial quotes before pricing. |
| 10 | MEDIUM   | **"Get Started Free" CTA text is generic.** Doesn't communicate the value. | Consider more specific copy: "Start Assigning Homework" or "Try It Free". |
| 11 | MEDIUM   | **No urgency or scarcity signals.** Every paid tier says "Get Started" with no differentiator. | Emphasise "No credit card required" more prominently on free tier. Consider trial language on paid tiers. |
| 12 | MEDIUM   | **AI teaser redirects to signup with no preview of the result.** User types a prompt, clicks Generate, and lands on a signup page. Feels like a bait-and-switch. | Show a skeleton/mock preview of the generated worksheet, then gate the full result behind signup. |
| 13 | LOW      | **Hero secondary CTA (`#preview`) scrolls to the first demo section** — may not be the most compelling content to land on first. | Ensure the scroll target is the most engaging section. |
| 14 | LOW      | **No mid-page CTAs.** Only the hero and final section contain signup links. | Add inline CTAs after How It Works and after the AI section. |

---

## 3. Content & Layout

### Issues

| #  | Severity | Finding | Recommendation |
|----|----------|---------|----------------|
| 15 | HIGH     | **Section order doesn't follow AIDA** (Attention → Interest → Desire → Action). The "Desire" phase (social proof, outcomes, credibility) is completely missing. | Restructure to include a Desire phase — see recommended order below. |
| 16 | HIGH     | **6 feature cards are undifferentiated.** "Homework that actually gets done" and "Assign homework via a link" say essentially the same thing. "Find the right tool fast" and "Build or generate your own" overlap with the AI section above. | Consolidate to 3–4 unique selling points with distinct value propositions. |
| 17 | MEDIUM   | **Visual rhythm is monotonous.** Every section follows the same pattern: centred heading → centred subheading → content block. Alternating bg colours help slightly but there's no layout variation. | Introduce layout variety: left-aligned content with right-aligned media, full-bleed testimonial strips, asymmetric grids. |
| 18 | MEDIUM   | **"Ready to ditch the photocopier?" closing CTA is weak.** Most therapists under 40 haven't used a photocopier — the metaphor may not land with the target demographic. | Reinforce core value: saving time, improving outcomes, or increasing client engagement. |
| 19 | MEDIUM   | **Feature card descriptions are uniform in tone and length** (~15 words each). Hard to scan and differentiate. | Vary format: some with bullet points, some with mini-stats, some with before/after comparisons. |
| 20 | LOW      | **Nav link "Resources" is vague.** Links to `/worksheets`. | Rename to "Worksheet Library" or "Browse Tools". |
| 21 | LOW      | **Footer includes "Feature Requests"** — internal tool, not a marketing destination. Clutters the footer for new visitors. | Remove from landing page footer or move to a logged-in dashboard. |

---

## Design Change: Tabbed Client Journey

**Problem:** Two separate sections ("See what your clients see" and "See the client experience") both demonstrate the client-facing experience. This duplicates the concept, adds scroll length, and splits the visitor's attention.

**Solution:** Merge into a single section with 3 clickable tabs above the interactive worksheet preview.

### Behaviour

- The existing `WorksheetPreview` section keeps its browser-chrome frame and heading ("See what your clients see").
- The 3 demo worksheets currently shown as cards in `ClientExperienceDemo` become **tab buttons** rendered directly above the embedded worksheet renderer.
- Clicking a tab swaps the worksheet schema and pre-filled values rendered inside the browser-chrome frame.
- The `ClientExperienceDemo` section is removed from the landing page.

### Tabs

Each tab corresponds to an entry from `DEMO_WORKSHEETS` (sourced from `@/lib/demo-data`):

| Tab Label          | Slug             | Icon       |
|--------------------|------------------|------------|
| Thought Record     | `thought-record` | Lightbulb  |
| Exposure Hierarchy | `hierarchy`      | Arrows     |
| Activity Schedule  | `schedule`       | Calendar   |

### Layout

```
┌─────────────────────────────────────────────┐
│  "See what your clients see"                │
│  Sub-copy about the interactive experience  │
│                                             │
│  ┌──────────────┬──────────────┬──────────┐ │
│  │▎Thought      │ Exposure     │ Activity │ │
│  │▎Record       │ Hierarchy    │ Schedule │ │
│  └──────────────┴──────────────┴──────────┘ │
│                                             │
│  ┌─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │
│  │  Browser chrome (dots + title bar)     │ │
│  │  ┌─────────────────────────────────┐   │ │
│  │  │                                 │   │ │
│  │  │  WorksheetRenderer              │   │ │
│  │  │  (schema + values from          │   │ │
│  │  │   selected tab)                 │   │ │
│  │  │                                 │   │ │
│  │  └─────────────────────────────────┘   │ │
│  └─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │
│                                             │
│  "Try the full experience →" link           │
│  (links to /hw/demo/:slug for active tab)   │
└─────────────────────────────────────────────┘
```

### Implementation Notes

- `WorksheetPreview` becomes a client component with `useState` for the active tab.
- Each tab needs: `schema: WorksheetSchema`, `values: Record<string, unknown>`, `title: string` (for the browser-chrome title bar).
- The existing thought-record demo data stays as the default selected tab.
- Schemas and demo values for the other two worksheets should be sourced from `DEMO_WORKSHEETS` in `@/lib/demo-data`, or defined inline if those don't include full schemas.
- The browser-chrome title bar text updates to match the selected worksheet name.
- The "Interactive" badge in the title bar stays.
- Add a "Try the full experience" link below the frame that deep-links to `/hw/demo/:active-slug`.
- Remove the standalone `ClientExperienceDemo` section from `page.tsx`.
- The `ClientExperienceDemo` component itself is still used on individual worksheet pages (`compact` mode), so do not delete it — only remove it from the landing page.

### Files Affected

| File | Change |
|------|--------|
| `src/app/page.tsx` | Remove `ClientExperienceDemo` section. |
| `src/components/marketing/worksheet-preview.tsx` | Add tab state, tab UI, schema-switching logic, "Try full experience" link. |
| `src/lib/demo-data.ts` | May need to export schemas/values for exposure hierarchy and activity schedule (check what's currently exported). |

---

## Recommended Section Order (Post-Audit)

1. **Nav**
2. **Hero** — problem/solution headline + primary CTA
3. **Social Proof Strip** *(new)* — "Trusted by X therapists" + professional credibility signals
4. **Tabbed Client Journey** *(merged)* — 3-tab interactive preview
5. **How It Works** — 3 steps (keep as-is)
6. **AI Showcase** — the differentiator feature
7. **Testimonials / Outcomes** *(new)* — 2–3 clinician quotes
8. **Pricing** — moved up (was section 8, now section 8 of fewer total sections)
9. **Features** — condensed to 3–4 cards (supporting detail)
10. **Final CTA** — stronger copy
11. **Footer**

---

## Priority Matrix

### P0 — Do First
- [ ] Merge demo sections into tabbed client journey (design change above)
- [ ] Add social proof strip after hero
- [ ] Consolidate feature cards from 6 → 3–4
- [ ] Reorder sections per recommended order

### P1 — Do Next
- [ ] Add `aria-hidden` to all decorative SVGs
- [ ] Improve AI teaser to show preview before signup gate
- [ ] Add mid-page CTAs after How It Works and AI sections
- [ ] Rewrite final CTA copy

### P2 — Polish
- [ ] Add skip-to-content link
- [ ] Add `aria-expanded` to mobile hamburger
- [ ] Rename "Resources" nav link
- [ ] Remove "Feature Requests" from footer
- [ ] Consider lazy hydration for below-fold components
- [ ] Introduce layout variation to break visual monotony
