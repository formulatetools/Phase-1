# Tier & Pricing Deliberation

**Date:** 2 March 2026
**Status:** Decision required
**Depends on:** `docs/pricing-audit.md` (bug inventory)

---

## Table of Contents

1. [Current State](#1-current-state)
2. [Full Feature Inventory](#2-full-feature-inventory)
3. [Audit Findings](#3-audit-findings)
4. [Market Context](#4-market-context)
5. [Option A — Fix Current 4-Tier Model](#5-option-a--fix-current-4-tier-model)
6. [Option B — Simplify to 3 Tiers](#6-option-b--simplify-to-3-tiers)
7. [Option C — Restructure Around Use Cases](#7-option-c--restructure-around-use-cases)
8. [Pricing Page Copy Recommendations](#8-pricing-page-copy-recommendations)
9. [Bugs to Fix Regardless of Pricing Decision](#9-bugs-to-fix-regardless-of-pricing-decision)
10. [Branding Tiers — Watermark → Discrete → White-Label](#10-branding-tiers--watermark--discrete--white-label)
11. [Decision Matrix](#11-decision-matrix)

---

## 1. Current State

### Tiers & Limits (from `src/lib/stripe/config.ts`)

| Feature | Free | Starter (£4.99) | Practice (£9.99) | Specialist (£19.99) |
|---|---|---|---|---|
| Monthly worksheet uses | 5 | ∞ | ∞ | ∞ |
| Max clients | 3 | 5 | ∞ | ∞ |
| Active assignments | 3 | 10 | ∞ | ∞ |
| Custom worksheets | 0 | 0 | 3 | 20 |
| AI generations/mo | 1 | 3 | 10 | ∞ |
| Supervisees | 0 | 0 | 4 | 8 |
| Shared resources/client | 5 | 20 | ∞ | ∞ |
| PDF branding | Branded | Clean | Clean | Clean |

Annual pricing: ~20% off (Starter £47.90/yr, Practice £95.90/yr, Specialist £191.90/yr).

### Internal → Display Name Mapping

| Internal (DB) | Display (UI) |
|---|---|
| `free` | Free |
| `starter` | Starter |
| `standard` | Practice |
| `professional` | Specialist |

---

## 2. Full Feature Inventory

Everything the platform actually offers, regardless of what's on the pricing page.

### Core Clinical Features (all tiers)

- **Worksheet Library** — 50+ curated CBT worksheets (thought records, formulations, exposure hierarchies, safety plans, etc.)
- **Formulation Diagrams** — 13 interactive clinical templates (Five Areas, Panic Cycle, Health Anxiety, Social Anxiety, GAD, PTSD, OCD, Depression, CBT-E, CFT, Insomnia, Chronic Pain, BDD) across 5 layout patterns
- **Homework Assignment** — Generate unique anonymous links for clients, no client account needed
- **Pre-fill** — Therapists can populate fields before sending to clients
- **Response Review** — View and track client submissions
- **Assignment Status Tracking** — Pending, in progress, completed, reviewed, withdrawn
- **Client Portal** — GDPR-compliant data access/deletion for clients via token-based portal
- **PIN Protection** — Optional PIN security on client portals

### Export Features (all tiers)

- **Fillable PDF** — A4 portrait, NHS hole-punch margins, interactive AcroForm fields
- **Interactive HTML** — Self-contained offline file with localStorage auto-save
- **Summary PDF** — Read-only export of completed worksheets
- **Client PDF Download** — Clients can download their completed responses from the portal

### Creation & Customisation Features (tiered)

- **Custom Worksheet Builder** — Visual editor with 16 field types (Practice+)
- **Fork & Customise** — Copy any library worksheet and modify it (Practice+)
- **AI Worksheet Generator** — Describe a worksheet in plain English, AI builds the schema (Practice+ currently usable)

### Supervision Features (tiered)

- **Supervision Portal** — Manage supervisees separately from clinical clients (Practice+)
- **Supervisee Assignment** — Assign supervision-specific worksheets (Practice+)
- **Supervisee Progress Tracking** — Monitor supervisee caseloads (Practice+)

### Engagement Features (all tiers)

- **Feature Request Board** — Submit and vote on feature requests
- **Referral Program** — Generate referral codes, track conversions
- **Blog/Clinical Content** — Read articles, clinical guides, worksheet guides
- **Promo Codes** — Time-limited tier access for trainees/events

### Resource Sharing Features (tiered)

- **Shared Resources** — Share links, videos, psychoeducation articles with clients
- **Embedded Video** — YouTube/Vimeo embeds in client portal
- **Psychoeducation Articles** — Built-in clinical articles shareable with clients

---

## 3. Audit Findings

### Critical Issues

#### 3.1 AI Generations Are Misleading on Free & Starter

**What's advertised:** Free gets 1 AI generation/mo, Starter gets 3/mo.

**What actually happens:** The AI generation lives on `/my-tools/new`, which redirects users away if `maxCustomWorksheets === 0`. Both Free and Starter have `maxCustomWorksheets: 0`. Users can never reach the UI.

The API endpoint (`/api/generate-worksheet`) would technically process the request (the `wsLimit > 0` check skips when limit is 0), but the page-level redirect prevents users from ever making the request.

**Impact:** Broken pricing promise. Users who upgrade to Starter expecting AI generation will find it inaccessible.

#### 3.2 PDF Branding Is Partially Enforced

**What's advertised:** Free = branded PDFs. Paid = clean PDFs.

**What's enforced:**
- Dashboard worksheet export: ✅ `showBranding={accessState === 'free_available'}` in `worksheet-detail.tsx`
- Client portal PDF download: ❌ Hardcoded `showBranding: true` in `response-viewer.tsx`
- Blank PDF generator: ❌ Hardcoded `showBranding: true` in `blank-pdf-generator.tsx`
- Response PDF generator: ❌ Hardcoded `showBranding: true` in `response-pdf-generator.tsx`

**Impact:** Paid therapists' clients see "Created with Formulate" branding on their homework PDFs, contradicting the clean-PDF promise.

#### 3.3 `is_premium` Worksheets Have No Gating

The database schema supports premium worksheets (`is_premium: boolean`), the admin UI can toggle it, and the worksheet listing shows premium badges. But no code prevents any user from accessing premium worksheets. It's purely cosmetic.

**Impact:** Low — no worksheets appear to be marked premium currently. But the infrastructure exists with no enforcement if ever used.

### Pricing Page Discrepancies

#### What's Advertised But Doesn't Work

| Claim | Tier | Issue |
|---|---|---|
| "3 AI generations per month" | Starter | Can't access the UI (custom worksheets = 0) |
| "Early access to new features" | Specialist | No implementation found — no feature flags, beta channels, or gating |

#### What Exists But Isn't Advertised

| Hidden Feature | Impact |
|---|---|
| Active assignment limits (3 / 10 / ∞ / ∞) | Users hit a wall without prior warning |
| Shared resources per client (5 / 20 / ∞ / ∞) | Limit exists but never communicated |
| Client portal (GDPR data access/deletion) | Significant feature, not mentioned on pricing |
| Interactive HTML export | Unique differentiator, not mentioned |
| 13 formulation diagram templates | Significant clinical feature, not mentioned |
| Homework pre-fill capability | Valuable for clinical workflow, not mentioned |
| Feature request board | Community engagement, not mentioned |
| Referral program | Growth lever, not mentioned |

#### Pricing Card Omissions (Misleading by Absence)

| Tier | Missing Information |
|---|---|
| Practice | "Custom worksheet builder" — doesn't mention limit of 3 |
| Practice | "Supervision portal" — doesn't mention limit of 4 supervisees |
| Free | Doesn't mention 1 AI generation (currently broken anyway) |
| Free | Doesn't mention 3 active assignment limit |
| Starter | Doesn't mention 10 active assignment limit |
| Starter | Doesn't mention 20 shared resources/client limit |

### FAQ Inconsistencies

| FAQ Statement | Issue |
|---|---|
| "Free demo on the homepage (one generation per month)" | Demo at `/api/demo-generate` is separate from tier-gated AI — potentially confusing |
| "Paid plans include 3 to unlimited AI generations" | Starter's 3 generations are unusable |
| "On the free tier, exported PDFs include a small Formulate watermark" | Only enforced on dashboard export, not client portal |

---

## 4. Market Context

### Target User Segments

| Segment | Typical Caseload | Key Needs | Price Sensitivity |
|---|---|---|---|
| **Trainee / student** | 2–5 clients | Library access, homework links, clean PDFs | Very high (no income yet) |
| **Early-career therapist** | 5–15 clients | Full client management, homework, exports | High |
| **Established solo practitioner** | 15–30 clients | Unlimited clients, custom tools, AI assist | Medium |
| **Supervisor / training lead** | 20+ clients + 3–8 supervisees | Supervision portal, oversight, large caseload | Lower |
| **Group practice lead** | 30+ clients + team | Multi-seat (future), org features | Low |

### How Current Tiers Map to Segments

| Tier | Intended Segment | Actual Fit |
|---|---|---|
| Free (3 clients) | Exploration / evaluation | ✅ Good trial — enough to test the workflow |
| Starter (5 clients) | Trainee? | ❌ Too few clients for even a trainee under supervision. No custom worksheets undermines the AI promise. |
| Practice (∞ clients) | Solo practitioner + supervisor | ✅ Good fit — but hidden limits on custom worksheets (3) and supervisees (4) |
| Specialist (∞ + 20 custom + 8 supervisees) | Power user / training lead | ⚠️ Thin differentiation — most users won't need 20 custom worksheets |

### The Starter Problem

Starter sits in an awkward gap:
- **Too expensive for trainees** (who might prefer free with occasional promo codes)
- **Too limited for practitioners** (5 clients isn't a real caseload)
- **Confusing AI promise** (advertised but unusable)
- **No unique selling point** — clean PDFs alone don't justify £4.99/mo

Evidence: The pricing page highlights Practice as "Most Popular," implicitly acknowledging that Starter isn't the target conversion tier.

### The Specialist Justification

For 2× the price of Practice, Specialist adds:
- 17 more custom worksheets (3 → 20)
- 4 more supervisees (4 → 8)
- Unlimited AI (10 → ∞)
- "Early access" (not implemented)

This is a modest upgrade. The primary value of Specialist is as a **pricing anchor** — making Practice look like better value by comparison. Whether Specialist converts at meaningful volume is a separate question.

---

## 5. Option A — Fix Current 4-Tier Model

**Philosophy:** Keep the existing structure but fix the gaps, make Starter actually useful, and clarify all limits.

### Proposed Limits

| Feature | Free | Starter (£4.99) | Practice (£9.99) | Specialist (£19.99) |
|---|---|---|---|---|
| Worksheet access | 5/mo | ∞ | ∞ | ∞ |
| Max clients | 3 | **15** | ∞ | ∞ |
| Active assignments | 3 | **20** | ∞ | ∞ |
| Custom worksheets | 0 | **3** | **10** | **∞** |
| AI generations/mo | **0** | 3 | 10 | ∞ |
| Supervisees | 0 | 0 | 4 | **∞** |
| Shared resources/client | 5 | **∞** | ∞ | ∞ |
| PDF branding | Watermark | Discrete logo | Discrete logo | Discrete logo |
| Priority support | — | — | — | **✓** |

### Changes from Current

| Change | Rationale |
|---|---|
| Free AI: 1 → **0** | Removes misleading claim. Homepage demo still available. |
| Starter clients: 5 → **15** | Matches a real small caseload. Trainees and early-career therapists fit here. |
| Starter assignments: 10 → **20** | Realistic for 15 clients (avg 1.3 active assignments each). |
| Starter custom worksheets: 0 → **3** | Makes AI generations actually usable. Gives Starter a creative tool. |
| Starter shared resources: 20 → **∞** | Not worth the complexity of tracking per-client limits on a paid tier. |
| Practice custom worksheets: 3 → **10** | More room before hitting the upgrade wall. 3 felt like a hard constraint for a £9.99 plan. |
| Specialist custom worksheets: 20 → **∞** | Clear "unlimited" messaging. Justifies premium price. |
| Specialist supervisees: 8 → **∞** | Clear "unlimited" messaging. Training organisations with 10+ supervisees now have a home. |
| Specialist: add **Priority support** | Tangible differentiator. Can be implemented as a badge/tag in feature request board + faster email responses. |

### Pricing Page Copy (Option A)

**Free**
- Browse the full worksheet library
- 5 worksheet uses per month
- Up to 3 clients with homework links
- Up to 3 active assignments
- PDF export (Formulate watermark)

**Starter — £4.99/mo**
- Everything in Free
- Unlimited worksheet access
- Up to 15 clients
- Up to 3 custom worksheets
- 3 AI generations per month
- Professional PDF export (discrete branding)

**Practice — £9.99/mo** *(Most Popular)*
- Everything in Starter
- Unlimited clients & assignments
- Up to 10 custom worksheets
- 10 AI generations per month
- Supervision portal (up to 4 supervisees)
- Unlimited shared resources

**Specialist — £19.99/mo**
- Everything in Practice
- Unlimited custom worksheets
- Unlimited AI generations
- Unlimited supervisees
- Priority support

### Pros

- Minimal disruption — no tier renaming, no Stripe product changes needed
- Starter becomes genuinely useful for trainees and small caseloads
- AI generation promise is fixed (Starter gets custom worksheet slots)
- Clear progression: Free → limited → generous → unlimited
- Existing subscribers are only positively affected (limits increase, never decrease)

### Cons

- 4 tiers may still cause decision paralysis for some users
- Starter at £4.99 with 15 clients might cannibalise Practice conversions
- "Priority support" for Specialist needs to be operationalised (even if lightweight)

### Code Changes Required

1. Update `TIER_LIMITS` in `src/lib/stripe/config.ts`
2. Update `AI_GENERATION_LIMITS` in `src/app/api/generate-worksheet/route.ts` (free: 1 → 0)
3. Update `TIER_FEATURES` in `src/lib/stripe/config.ts`
4. Update `tiers` array in `src/components/marketing/pricing-table.tsx`
5. Update FAQ in `src/lib/faq-data.ts`
6. No Stripe price changes needed (prices stay the same)
7. No database changes needed (limits are application-level)

---

## 6. Option B — Simplify to 3 Tiers

**Philosophy:** Remove Starter entirely. Free is for evaluation, Practice is for all practitioners, Specialist is for supervisors/power users.

### Proposed Limits

| Feature | Free | Practice (£9.99) | Specialist (£19.99) |
|---|---|---|---|
| Worksheet access | 5/mo | ∞ | ∞ |
| Max clients | 3 | ∞ | ∞ |
| Active assignments | 3 | ∞ | ∞ |
| Custom worksheets | 0 | **5** | **∞** |
| AI generations/mo | **0** | 10 | ∞ |
| Supervisees | 0 | 0 | **8** |
| Shared resources/client | 5 | ∞ | ∞ |
| PDF branding | Watermark | Discrete logo | Discrete logo |

### Key Design Decisions

- **No Starter tier** — users go directly from Free to Practice
- **Supervision is exclusively Specialist** — cleaner separation; supervision is a niche need that justifies premium pricing
- **Practice gets 5 custom worksheets** — generous enough for most practitioners
- **Specialist gets 8 supervisees** (not unlimited) — keeps a ceiling that could expand to a future "Enterprise" tier
- **AI removed from Free** — homepage demo remains available

### Migration Plan for Existing Starter Subscribers

Options:
1. **Grandfather them** — keep Starter active for existing subscribers, don't sell it to new users
2. **Upgrade them to Practice** — automatically move them to Practice at their current price (£4.99) until their next billing cycle, then offer a transition discount
3. **Honour the price** — let existing Starter subscribers keep paying £4.99/mo for a subset of Practice features

Recommended: **Grandfather + sunset.** Keep existing Starter subscribers at their current limits. Remove Starter from the pricing page. When subscribers' annual period ends, offer them Practice at 50% off for the first year (£59.94/yr instead of £95.90/yr).

### Pricing Page Copy (Option B)

**Free**
- Browse the full worksheet library
- 5 worksheet uses per month
- Up to 3 clients with homework links
- PDF export (Formulate watermark)

**Practice — £9.99/mo** *(Recommended)*
- Unlimited worksheet access
- Unlimited clients & assignments
- Up to 5 custom worksheets
- 10 AI generations per month
- Professional PDF export (discrete branding)
- Shared resources with clients

**Specialist — £19.99/mo**
- Everything in Practice
- Unlimited custom worksheets
- Unlimited AI generations
- Supervision portal (up to 8 supervisees)
- Professional PDF export (discrete branding)
- Priority support

### Pros

- **Simpler decision** — users evaluate one jump: Free → Practice
- **Higher conversion clarity** — no "should I get Starter or Practice?" deliberation
- **Clean messaging** — Practice = practitioner, Specialist = supervisor
- **Supervision as premium differentiator** — clear reason to upgrade

### Cons

- **No low-cost entry point** — trainees might balk at £9.99/mo directly from Free
- **Starter migration complexity** — need to handle existing subscribers gracefully
- **Less pricing flexibility** — can't A/B test a mid-range price point
- **Revenue risk** — if Starter subscribers were converting to Practice eventually, removing the stepping stone might reduce overall conversion

### Code Changes Required

1. Update `TIER_LIMITS` in `src/lib/stripe/config.ts` (remove starter, adjust standard/professional)
2. Update `AI_GENERATION_LIMITS` (remove starter, free → 0)
3. Update `TIER_FEATURES`, `TIER_PRICES`, `STRIPE_PRICES` (remove starter entries)
4. Update `TIER_LABELS` (remove starter)
5. Rewrite `src/components/marketing/pricing-table.tsx` (3 cards instead of 4)
6. Update FAQ in `src/lib/faq-data.ts`
7. Update checkout route to reject `tier=starter` for new signups
8. Keep Stripe Starter prices active but don't expose them (for grandfathered users)
9. Add supervision gating to Specialist only (move from standard to professional)
10. Update all error messages that reference tier names

---

## 7. Option C — Restructure Around Use Cases

**Philosophy:** Name tiers after their target user, not abstract labels. Make it immediately clear who each tier is for.

### Proposed Limits

| Feature | Free | Solo (£5.99) | Practice (£11.99) | Supervisor (£19.99) |
|---|---|---|---|---|
| Worksheet access | 5/mo | ∞ | ∞ | ∞ |
| Max clients | 3 | **15** | ∞ | ∞ |
| Active assignments | 3 | **20** | ∞ | ∞ |
| Custom worksheets | 0 | **3** | **10** | **∞** |
| AI generations/mo | 0 | **5** | **15** | ∞ |
| Supervisees | 0 | 0 | 0 | **10** |
| Shared resources/client | 5 | ∞ | ∞ | ∞ |
| PDF branding | Watermark | Discrete logo | Discrete logo | Discrete logo |

### Key Design Decisions

- **Tier names match personas** — "Solo" immediately tells a single practitioner this is their tier
- **Slightly higher prices** — £5.99 and £11.99 capture more value without crossing psychological thresholds (under £6, under £12)
- **Supervision is exclusively top-tier** — only "Supervisor" tier gets supervision features; this is the clearest differentiator
- **Practice gets 0 supervisees** — if you supervise anyone, you need the Supervisor tier
- **More AI for everyone** — 5/15/∞ instead of 3/10/∞; AI is cheap to serve and drives engagement
- **Supervisor gets 10 supervisees** — higher ceiling than current Specialist (8)

### Annual Pricing

| Tier | Monthly | Annual | Annual/mo | Savings |
|---|---|---|---|---|
| Solo | £5.99 | £57.50 | £4.79 | 20% |
| Practice | £11.99 | £115.10 | £9.59 | 20% |
| Supervisor | £19.99 | £191.90 | £15.99 | 20% |

### Pricing Page Copy (Option C)

**Free**
- Browse the full worksheet library
- 5 worksheet uses per month
- Up to 3 clients
- PDF export (Formulate watermark)

**Solo — £5.99/mo** *For individual practitioners*
- Unlimited worksheet access
- Up to 15 clients
- Up to 3 custom worksheets
- 5 AI generations per month
- Professional PDF export (discrete branding)

**Practice — £11.99/mo** *For growing caseloads* *(Most Popular)*
- Everything in Solo
- Unlimited clients & assignments
- Up to 10 custom worksheets
- 15 AI generations per month
- Unlimited shared resources

**Supervisor — £19.99/mo** *For supervisors & training leads*
- Everything in Practice
- Unlimited custom worksheets
- Unlimited AI generations
- Supervision portal (up to 10 supervisees)
- Professional PDF export (discrete branding)
- Priority support

### Pros

- **Self-selecting tiers** — users immediately know which is for them
- **Higher ARPU** — slight price increases (£5.99/£11.99 vs £4.99/£9.99) over time
- **Clean supervision story** — supervision is a clear premium feature, not bundled mid-tier
- **Scalable naming** — could add "Team" or "Enterprise" above Supervisor later

### Cons

- **Breaking change** — internal tier names need renaming (starter → solo, standard → practice stays, professional → supervisor)
- **Migration complexity** — existing subscribers need mapping to new tiers
- **Stripe product recreation** — new products/prices in Stripe for new names
- **Database migration** — `subscription_tier` enum needs updating
- **SEO/link disruption** — if pricing page URL or tier names are indexed
- **Higher prices might reduce conversion** — even £1/mo difference can matter

### Code Changes Required

1. Database migration: alter `subscription_tier` enum (add new values, map old ones)
2. New Stripe products and price IDs
3. Full rewrite of `src/lib/stripe/config.ts`
4. Update all tier references across the codebase (~50+ files)
5. Update `src/components/marketing/pricing-table.tsx`
6. Update FAQ, checkout success page, settings page
7. Webhook handler: map old price IDs to new tiers (backward compat for existing subs)
8. Update all error messages referencing tier names

---

## 8. Pricing Page Copy Recommendations

Regardless of which option is chosen, the pricing page should be improved:

### Features to Add to the Pricing Page

These are real, shipped features that should be highlighted:

| Feature | Where to Mention | Why |
|---|---|---|
| **Client portal** (GDPR data access) | All tiers — as a platform-wide benefit below the cards | Strong trust signal for NHS/GDPR-conscious buyers |
| **13 formulation diagrams** | Library/Free tier or as a platform highlight | Unique differentiator vs. paper worksheets |
| **Interactive HTML export** | All paid tiers or as a platform highlight | Not offered by competitors |
| **Homework pre-fill** | Anywhere homework is mentioned | Saves therapist time — key value prop |
| **Anonymous client links** (no account needed) | Starter+ where homework is mentioned | Reduces friction for clients |
| **Active assignment limits** | Free and Starter tiers | Prevents surprise when hitting limits |
| **Shared resource limits** | Free tier at minimum | Prevents surprise |
| **Custom worksheet limits** | Practice tier specifically | Currently hidden — users will feel tricked |
| **Supervisee limits** | Practice tier specifically | Currently hidden — users will feel tricked |

### Recommended Page Structure

Instead of just tier cards, consider:

1. **Tier comparison cards** (current format, but with accurate limits)
2. **Platform features section** below cards — "Included with every plan"
   - Client portal with GDPR data controls
   - 13 interactive formulation diagram templates
   - Anonymous homework links (no client login)
   - Fillable PDF, interactive HTML, and summary PDF exports
   - Feature request board
3. **Full comparison table** (expandable) — every feature, every tier, checkmarks and limits
4. **FAQ section** (already exists, needs updating)

---

## 9. Bugs to Fix Regardless of Pricing Decision

These should be fixed no matter which tier structure is chosen:

### Bug 1: Client Portal PDF Branding (High)

**Files:** `src/components/client-portal/response-viewer.tsx`, `src/components/client-portal/response-pdf-generator.tsx`, `src/components/homework/blank-pdf-generator.tsx`

**Problem:** `showBranding` is hardcoded to `true`. Should respect the assigning therapist's subscription tier.

**Fix:** Pass the therapist's tier (available via the assignment → therapeutic_relationship → therapist profile) and set `showBranding` based on whether they're on the free tier.

### Bug 2: AI Generation Unreachable on Free/Starter (Critical)

**File:** `src/app/(dashboard)/my-tools/new/page.tsx`

**Problem:** Page redirects users with `maxCustomWorksheets === 0`, preventing Free/Starter from using advertised AI generations.

**Fix depends on pricing decision:**
- If giving Starter custom worksheets: bug resolves itself
- If removing AI from Free/Starter: update pricing page to match reality
- If keeping current tiers: need a separate AI preview flow that doesn't require custom worksheet slots

### Bug 3: "Early Access" Not Implemented (Low)

**File:** `src/components/marketing/pricing-table.tsx`

**Problem:** Specialist tier advertises "Early access to new features" but no feature-flagging system exists.

**Fix:** Either implement a feature flag system (check `tier === 'professional'` before enabling new features) or remove the claim from the pricing page.

### Bug 4: Practice Limits Not Shown (Medium)

**File:** `src/components/marketing/pricing-table.tsx`

**Problem:** Practice card says "Custom worksheet builder" and "Supervision portal" without mentioning their limits (3 and 4 respectively). Specialist card does mention its limits ("Up to 20", "Up to 8").

**Fix:** Update Practice card copy to include "Up to 3 custom worksheets" and "Up to 4 supervisees."

---

## 10. Branding Tiers — Watermark → Discrete → White-Label

A three-level branding model that creates a clear upgrade path and opens the door to a future Enterprise tier:

### Branding Levels

| Level | Tier | What It Looks Like |
|---|---|---|
| **Branded** | Free | "Created with Formulate" watermark in PDF footer + client portal footer. Visible but not intrusive. Drives organic awareness. |
| **Discrete** | Starter / Practice / Specialist | Small Formulate logo in PDF footer corner. No watermark text. Clean enough for professional use but Formulate still gets subtle attribution. |
| **White-label** | Enterprise (future) | No Formulate branding anywhere. Clinic can upload their own logo, which appears on: PDFs (header/footer), client portal header, homework pages, email templates. Full custom branding. |

### Why This Works

1. **Free → Branded** is honest and drives growth. Therapists sharing worksheets with clients become organic marketing.
2. **Paid → Discrete** feels professional. A small logo in the corner is standard for SaaS tools and doesn't embarrass the therapist. It's a meaningful upgrade from a watermark.
3. **Enterprise → White-label** is a premium feature that clinics, training programmes, and NHS trusts would pay significantly more for. It's the kind of feature that justifies £39.99–£79.99/mo.

### White-Label Scope (Enterprise Tier)

What clinics could customise:

| Surface | Customisation |
|---|---|
| PDF exports | Custom logo in header, clinic name in footer, optional clinic contact info |
| Client portal | Custom logo, clinic name, optional colour accent |
| Homework pages | Custom header with clinic branding |
| Email templates | Clinic logo and name in homework notifications |
| Client-facing text | Optional custom welcome message on portal |

### Implementation Considerations

- **Current state:** `showBranding: boolean` — a simple on/off flag
- **New model:** `brandingLevel: 'watermark' | 'discrete' | 'whitelabel'`
- **Storage:** Clinic branding assets (logo URL, clinic name, accent colour) would live in a new `clinic_branding` table or as JSONB on the `profiles` table
- **PDF changes:** `fillable-pdf.ts` and `pdf-export.ts` already support `showBranding` — extend to support a discrete logo mode and a custom logo mode
- **Client portal:** Already uses the therapist's profile for context — could pull branding from there

### Enterprise Tier Sketch

| Feature | Enterprise |
|---|---|
| Everything in Specialist | ✓ |
| White-label branding (PDFs, portal, homework, emails) | ✓ |
| Custom worksheets | ∞ |
| Supervisees | ∞ |
| AI generations | ∞ |
| Priority support | ✓ |
| Dedicated onboarding | ✓ |
| Price | £49.99–£79.99/mo |

This tier targets:
- Private clinics with 3+ therapists sharing a brand
- NHS training programmes
- University clinical psychology departments
- IAPT services wanting branded digital tools

> **Note:** Enterprise is a future consideration. The current priority is fixing the Free/Paid branding gap (watermark vs discrete) and ensuring it's enforced consistently across all PDF export paths.

---

## 11. Decision Matrix (Updated with Branding)

| Criterion | Option A (Fix 4-Tier) | Option B (3 Tiers) | Option C (Use-Case Names) |
|---|---|---|---|
| **Implementation effort** | Low (config changes only) | Medium (migration + grandfathering) | High (DB migration + Stripe rebuild) |
| **Risk to existing subscribers** | None (all limits increase) | Medium (Starter sunset) | High (full tier rename) |
| **Clarity for new users** | Good (4 clear tiers) | Best (fewer choices) | Best (self-selecting names) |
| **Revenue impact** | Neutral to positive | Slight risk (no stepping stone) | Slight positive (higher prices) |
| **Conversion funnel** | Clear progression | Clean binary choice | Clear personas |
| **Future flexibility** | Moderate | High (can add tier later) | High (naming convention scales) |
| **Time to implement** | 1–2 hours | 1–2 days | 3–5 days |
| **Stripe changes needed** | None | Deprecate 2 prices | Create 6 new prices |
| **Database changes needed** | None | None (keep enum, stop selling) | ALTER TYPE + data migration |

### Recommendation

**Start with Option A.** It fixes all critical issues with minimal risk:
- No breaking changes for existing subscribers
- No database migration
- No Stripe product changes
- Can be implemented and deployed in a single session
- Preserves the option to simplify to 3 tiers later (Option B) once you have conversion data on whether Starter actually converts

If conversion data later shows that Starter has low adoption or doesn't lead to Practice upgrades, **migrate to Option B** by sunsetting Starter.

**Option C** is the strongest long-term position but carries the most implementation risk. Consider it for a future "v2 pricing" launch when there's enough subscriber volume to justify the migration effort.

---

## Files Referenced

| File | Purpose |
|---|---|
| `src/lib/stripe/config.ts` | TIER_LIMITS, TIER_PRICES, STRIPE_PRICES, TIER_LABELS, TIER_FEATURES |
| `src/components/marketing/pricing-table.tsx` | Pricing page tier cards |
| `src/app/api/generate-worksheet/route.ts` | AI generation limits + custom worksheet gate |
| `src/app/(dashboard)/my-tools/new/page.tsx` | Custom worksheet creation gate (redirect) |
| `src/app/(dashboard)/clients/actions.ts` | Client + assignment + shared resource limits |
| `src/app/(dashboard)/my-tools/actions.ts` | Custom worksheet count enforcement |
| `src/app/(dashboard)/supervision/actions.ts` | Supervisee limit enforcement |
| `src/app/(dashboard)/worksheets/actions.ts` | Free tier usage tracking |
| `src/app/api/webhooks/stripe/route.ts` | Subscription lifecycle management |
| `src/lib/faq-data.ts` | FAQ content |
| `src/components/client-portal/response-viewer.tsx` | Client portal PDF export (branding bug) |
| `src/components/client-portal/response-pdf-generator.tsx` | Response PDF generator (branding bug) |
| `src/components/homework/blank-pdf-generator.tsx` | Blank PDF generator (branding bug) |
| `src/components/worksheets/worksheet-detail.tsx` | Dashboard PDF export (branding correctly enforced) |
| `src/app/(dashboard)/checkout/success/page.tsx` | Post-checkout feature display (uses TIER_FEATURES) |
