# UX Improvements — Implementation Spec

**Status**: Approved, not yet implemented
**Created**: 2026-03-05

## Context

Competitive analysis revealed actionable UX gaps vs Psychology Tools and SaaS best practices. All high, medium, and polish-tier improvements that don't require social proof (no testimonials yet). 8 items across marketing, auth, and content pages.

---

## A: Hero Copy Rewrite (`src/app/page.tsx`)

**Current**: "Stop printing PDFs. Start assigning interactive homework."
**New**: "Homework your clients actually complete." — benefit-first, addresses the real pain (non-compliance, not printing)

### Changes
- Headline → `"Homework your clients actually complete."` with brand-coloured subtitle `"Built for CBT therapists. Powered by AI."`
- Subheadline → `"A curated library of interactive CBT worksheets that clients complete on any device — or describe what you need and let AI build it in seconds."`
- Add stats bar below subtitle: `"137+ worksheets · 20 formulation diagrams · Built by clinicians"`
- Primary CTA → `"Create My First Worksheet"` (action-oriented, specific)
- Bottom CTA heading → `"Ready to streamline your practice?"` (profession-specific)
- Bottom CTA button → `"Create My First Worksheet"`
- Keep `"Start free. No credit card required."` reassurance

---

## B: Signup Page Fixes (`src/app/(auth)/signup/page.tsx` + `src/components/ui/auth-form.tsx`)

### Changes to `signup/page.tsx`
- Subtitle → `"Get instant access to 137+ professional CBT worksheets"` (concrete value, not "5 tools per month")

### Changes to `auth-form.tsx`
- Combine two Terms/Privacy checkboxes into one: `"I agree to the Terms of Service and Privacy Policy"` (both linked)
- Single state: `acceptTermsAndPrivacy` replaces `acceptTerms` + `acceptPrivacy`
- Button text: `"Create Account"` → `"Create My Free Account"` (reinforces free)
- Disabled condition: `!acceptTermsAndPrivacy` (was `!acceptTerms || !acceptPrivacy`)

---

## C: Pricing Page Enhancements (`src/app/(marketing)/pricing/page.tsx` + `src/components/marketing/pricing-table.tsx`)

### Changes to `pricing/page.tsx`
- Add feature comparison matrix table below the pricing cards
- Embed 5 pricing-relevant FAQs at the bottom (import from `faq-data.ts`)
- Use `KeyFaqList` component for the embedded FAQs

### Feature comparison matrix
A table comparing: Free | Starter | Practice | Specialist across rows:
- Worksheet library access (✓ all)
- Monthly uses (5 / ∞ / ∞ / ∞)
- Clients (3 / 8 / ∞ / ∞)
- Custom worksheets (✗ / 3 / 15 / ∞)
- AI generations/month (1 / 3 / 10 / ∞)
- Homework plans (✗ / 1 / 3 / ∞)
- Supervision portal (✗ / ✗ / Up to 4 / ∞)
- Fork & customise (✗ / ✗ / ✓ / ✓)
- PDF branding (Watermark / Minimal / Minimal / Minimal)

### Changes to `pricing-table.tsx`
- Export `tiers` array so it can be reused by the comparison matrix
- Show annual per-month savings more prominently: add `"That's just £X.XX/mo"` text

### Pricing FAQs to embed (from `faq-data.ts`)
Select 5 questions: "How much does Formulate cost?", "Can I cancel at any time?", "What happens to my data if I downgrade?", "Do you offer student or trainee discounts?", "What payment methods do you accept?"

### Changes to `faq-data.ts`
- Add new FAQ: `"Is Formulate GDPR compliant?"` to "Privacy & Data Security" category
  - Answer covers: encryption at rest, RLS, pseudonymous labels, client portal, PII stripping, 90-day retention

---

## D: Security & Trust Page (NEW: `src/app/(marketing)/security/page.tsx`)

### Content sections
1. **Encryption & Infrastructure** — AES-256 at rest, TLS in transit, Supabase (AWS eu-west-2)
2. **Access Control** — Row-level security, per-therapist data isolation
3. **GDPR Compliance** — Pseudonymous labels, client data portal, right to erasure, 90-day retention
4. **AI Data Handling** — PII stripping before processing, no model training on user data
5. **Subprocessors** — Supabase (database), Stripe (payments), Resend (email), Anthropic (AI), Vercel (hosting), Sentry (errors)
6. **Content Security Policy** — Nonce-based CSP, strict script-src
7. **Contact** — `hello@formulatetools.co.uk` for security concerns

### Layout
- Server component, no client JS
- Metadata with canonical `/security`
- Reuse marketing layout (LandingNav + MarketingFooter via route group)
- Card-based grid for sections, table for subprocessors

---

## E: Worksheet Detail Enrichment (`src/app/(dashboard)/worksheets/[slug]/page.tsx`)

### Changes
- **"When to use this"** section: derive from `worksheet.tags` array
  - Map tags to clinical descriptors (e.g., `["anxiety", "CBT"]` → `"Suitable for clients presenting with anxiety. Based on CBT principles."`)
  - Show below instructions, above the worksheet renderer
  - Skip if no tags
- **"Related worksheets"** section: query 4 worksheets from same category (excluding current)
  - Show at bottom of page as horizontal card grid
  - Link to each worksheet's detail page
  - Skip if no category or no related worksheets found

---

## F: FAQ Search (`src/components/marketing/faq-search.tsx` + `src/app/(marketing)/faq/page.tsx`)

### New component: `faq-search.tsx`
- `'use client'` component with search input at top of FAQ page
- Filters `KEY_FAQ` + `EXTENDED_FAQ` by matching query against `q` and `a` fields (case-insensitive)
- No results state: `"No questions match your search"`
- Empty query: show full FAQ as-is (unchanged current layout)

### Changes to `faq/page.tsx`
- Import `FaqSearch` component
- Wrap FAQ content with search functionality
- Pass `KEY_FAQ` and `EXTENDED_FAQ` as props

---

## G: Login Page Polish (`src/app/(auth)/login/page.tsx`)

### Changes
- Add tagline below "Sign in to your account": `"137+ CBT tools ready when you are"`
- Tiny change — just add one `<p>` element

---

## H: Navigation Updates

### `src/components/marketing/landing-nav.tsx`
- Make Pricing link context-aware: `#pricing` when on homepage (`/`), `/pricing` when elsewhere
- Add `usePathname()` import from `next/navigation`
- Apply to both desktop and mobile nav links

### `src/components/marketing/marketing-footer.tsx`
- Add "Security" link between "FAQ" and "Feature Requests"
- Links to `/security`

---

## Implementation Order

1. **G** — Login tagline (1 line change, warm-up)
2. **B** — Signup fixes (combine checkboxes, copy, button text)
3. **F** — FAQ search (new component + page integration)
4. **A** — Hero rewrite (headline, stats, CTAs)
5. **H** — Nav updates (context-aware pricing, security footer link)
6. **D** — Security page (new page)
7. **C** — Pricing enhancements (comparison matrix, embedded FAQs)
8. **E** — Worksheet enrichment (when to use, related worksheets)

## Files touched

| Action | File |
|--------|------|
| Modify | `src/app/(auth)/login/page.tsx` |
| Modify | `src/app/(auth)/signup/page.tsx` |
| Modify | `src/components/ui/auth-form.tsx` |
| Create | `src/components/marketing/faq-search.tsx` |
| Modify | `src/app/(marketing)/faq/page.tsx` |
| Modify | `src/app/page.tsx` |
| Modify | `src/components/marketing/landing-nav.tsx` |
| Modify | `src/components/marketing/marketing-footer.tsx` |
| Create | `src/app/(marketing)/security/page.tsx` |
| Modify | `src/app/(marketing)/pricing/page.tsx` |
| Modify | `src/components/marketing/pricing-table.tsx` |
| Modify | `src/app/(dashboard)/worksheets/[slug]/page.tsx` |
| Modify | `src/lib/faq-data.ts` |

## Verification

1. `pnpm lint && pnpm typecheck && pnpm build && pnpm test` — all pass
2. Visual check: homepage hero, signup, login, pricing, FAQ, security page, worksheet detail
3. Mobile check: all pages render correctly at 375px
4. Navigation: pricing link goes to `#pricing` on homepage, `/pricing` elsewhere
5. FAQ search: filtering works, empty state shown, full FAQ shown with empty query
6. Security page: accessible at `/security`, linked from footer
7. Worksheet detail: "When to use" and "Related" sections appear when data exists
