# Pricing & Tier Gating Audit

**Date:** 1 March 2026
**Status:** Audit complete — pending decisions

---

## Current Tier Structure

| | **Free** | **Starter (£4.99/mo)** | **Practice (£9.99/mo)** | **Specialist (£19.99/mo)** |
|---|---|---|---|---|
| Monthly worksheet uses | 5 | ∞ | ∞ | ∞ |
| Clients | 3 | 5 | ∞ | ∞ |
| Active assignments | 3 | 10 | ∞ | ∞ |
| Custom worksheets | 0 | 0 | 3 | 20 |
| AI generations/month | 1 | 3 | 10 | ∞ |
| Supervisees | 0 | 0 | 4 | 8 |
| PDF export | Branded | Clean | Clean | Clean |

Annual pricing: 20% off (Starter £47.90/yr, Practice £95.90/yr, Specialist £191.90/yr).

---

## Enforcement Summary

Every feature gate is enforced server-side. Key enforcement locations:

| Feature | Enforcement file | Method |
|---------|-----------------|--------|
| Client limit | `src/app/(dashboard)/clients/actions.ts` → `createClient_action()` | Returns `{ error, limitReached: true }` |
| Assignment limit | `src/app/(dashboard)/clients/actions.ts` → `createAssignment()` | Returns `{ error, limitReached: true }` |
| Custom worksheets | `src/app/(dashboard)/my-tools/new/page.tsx` | Redirect to `/my-tools` if at limit |
| AI generations | `src/app/api/generate-worksheet/route.ts` | 403/429 HTTP error |
| Supervisees | `src/app/(dashboard)/supervision/actions.ts` → `createSupervisee()` | Returns `{ error, limitReached: true }` |
| Monthly uses (free) | `src/app/(dashboard)/worksheets/actions.ts` → `trackAccess()` | Increments counter |
| Promo expiry | `src/lib/supabase/auth.ts` → `getCurrentUser()` | Lazy check, reverts tier |

Config source: `src/lib/stripe/config.ts` → `TIER_LIMITS`, `TIER_PRICES`, `STRIPE_PRICES`.

AI generation limits are defined separately in `src/app/api/generate-worksheet/route.ts` → `AI_GENERATION_LIMITS`.

---

## Issues Found

### Issue 1 — AI generation is unusable on Free and Starter (bug)

**Severity:** High — pricing promise is broken.

The pricing page advertises:
- Free: 1 AI generation/month
- Starter: 3 AI generations/month

But the AI generation endpoint (`/api/generate-worksheet/route.ts`) checks the **custom worksheet limit** before allowing generation. Since `maxCustomWorksheets` is 0 for both Free and Starter, the endpoint blocks the request before it reaches the AI.

**Result:** Free and Starter users see "AI generation" advertised but cannot actually use it. This is misleading.

**Options:**
- A) Remove AI generation from Free and Starter pricing cards (honest, simple)
- B) Allow AI-generated worksheets to bypass the custom worksheet limit (treat them as ephemeral previews or library forks)
- C) Give Free 1 custom worksheet slot and Starter 2-3 slots so the AI generations are usable

---

### Issue 2 — Practice tier's custom worksheet limit is hidden

**Severity:** Medium — causes surprise when users hit the wall.

The pricing card for Practice says "Custom worksheet builder" and "Fork & customise any tool" but does not mention the limit of 3. The Specialist card does say "Up to 20 custom worksheets."

A user upgrading to Practice expecting unlimited custom worksheets will hit a wall at 3 with no prior warning.

**Options:**
- A) Add "Up to 3 custom worksheets" to the Practice pricing card
- B) Raise Practice's limit to something that feels unlimited for most users (e.g. 10)

---

### Issue 3 — "Worksheet uses" is ambiguous

**Severity:** Medium — confusing for users deciding whether to upgrade.

The pricing page says "5 worksheet uses per month" for the Free tier. Looking at the code, a "use" is counted when a free-tier user interacts with or exports a worksheet (tracked in `trackAccess()`). Browsing and viewing worksheets may or may not count depending on the access type logged.

A therapist who opens several worksheets to compare them before a session could burn through their quota without assigning anything.

**Options:**
- A) Rename to "5 exports per month" or "5 downloads per month" (if that matches the actual gate)
- B) Change the metric to something clearer: "5 assignments per month" or "5 completed worksheets per month"
- C) Add a tooltip or footnote explaining what counts as a use

---

### Issue 4 — Starter tier may not justify its existence

**Severity:** Low (commercial/strategic) — not a bug, but affects conversion.

Free gives 3 clients. Starter gives 5 clients. A therapist with a typical private caseload (8-15 active clients) outgrows **both** tiers immediately and needs Practice (£9.99/mo).

Starter's unique value over Free:
- Unlimited worksheet access (vs 5/month)
- Clean PDF export (no branding)
- 2 extra clients (3→5)
- 7 more active assignments (3→10)
- 3 AI generations (but unusable per Issue 1)

This may not feel worth £4.99/mo when you still can't manage your full caseload.

**Options:**
- A) Raise Starter's client limit to 15-20 (makes it genuinely useful for small practices)
- B) Remove Starter entirely — simplify to Free / Practice / Specialist (3 tiers are easier to parse)
- C) Reposition Starter as "for trainees" with a lower price point (£2.99/mo) and appropriate limits

---

### Issue 5 — PDF branding enforcement is missing

**Severity:** Low — feature advertised but possibly not enforced.

The pricing page shows "PDF export (Formulate branding)" for Free and "Clean PDF export (no branding)" for paid tiers. No code was found in `fillable-pdf.ts` or `pdf-export.ts` that adds or removes branding based on subscription tier.

**Options:**
- A) Implement branding: add a small "Created with Formulate" footer to PDFs for free-tier users
- B) Remove the claim from the pricing page if branding isn't a priority

---

### Issue 6 — Specialist tier may be premature

**Severity:** Low (commercial/strategic).

At £19.99/mo, Specialist adds: 20 custom worksheets (vs 3), unlimited AI generations (vs 10), 8 supervisees (vs 4), and "early access to new features."

For a solo practitioner, 20 custom worksheets and 8 supervisees is likely overkill. This tier makes more sense for group practices or training organisations, but the platform is designed around individual therapists.

**Options:**
- A) Keep as-is — it serves as an anchor price that makes Practice look like better value
- B) Fold key features into Practice at a slightly higher price (£12.99/mo) and remove Specialist until there's demand
- C) Reposition Specialist as a "Team" or "Training" plan with features that justify the premium (multi-seat, shared library, org-level analytics)

---

## "Free forever" Claim Assessment

The claim is currently **safe and honest**:
- Free tier is properly defined with clear limits (5 uses, 3 clients, 3 assignments)
- The promo/trial system is separate — promos temporarily elevate the tier, then cleanly revert
- No code paths exist that would degrade the free tier below its current offering

**Risk:** Only becomes a problem if the free tier limits are ever reduced below their current values. This would be perceived as breaking the "forever" promise.

**Recommendation:** Keep the claim. It's a strong trust signal for the therapist audience. Ensure any future tier changes only add to (never subtract from) the free tier.

---

## Recommended Priority Order

1. **Fix AI generation gating** (Issue 1) — this is a broken promise on the pricing page
2. **Show Practice's custom worksheet limit** (Issue 2) — prevents bad upgrade experience
3. **Clarify "worksheet uses"** (Issue 3) — reduces confusion
4. **Implement or remove PDF branding** (Issue 5) — align code with pricing claims
5. **Consider Starter tier changes** (Issue 4) — strategic decision, no rush
6. **Consider Specialist tier changes** (Issue 6) — strategic decision, no rush

---

## Files Referenced

| File | Purpose |
|------|---------|
| `src/lib/stripe/config.ts` | TIER_LIMITS, TIER_PRICES, STRIPE_PRICES, TIER_LABELS |
| `src/components/marketing/pricing-table.tsx` | Pricing page tier cards and feature lists |
| `src/app/api/generate-worksheet/route.ts` | AI generation limits + custom worksheet gate |
| `src/app/(dashboard)/clients/actions.ts` | Client + assignment limit enforcement |
| `src/app/(dashboard)/my-tools/new/page.tsx` | Custom worksheet creation gate |
| `src/app/(dashboard)/my-tools/actions.ts` | Custom worksheet count enforcement |
| `src/app/(dashboard)/supervision/actions.ts` | Supervisee limit enforcement |
| `src/app/(dashboard)/worksheets/actions.ts` | Free tier usage tracking |
| `src/app/api/webhooks/stripe/route.ts` | Subscription lifecycle management |
| `src/app/(dashboard)/promo/actions.ts` | Promo code validation and redemption |
| `src/lib/supabase/auth.ts` | Promo expiry check in getCurrentUser() |
| `src/components/ui/subscription-details.tsx` | Settings page tier display |
| `src/lib/utils/fillable-pdf.ts` | PDF export (no branding gate found) |
| `src/lib/utils/pdf-export.ts` | PDF export (no branding gate found) |
