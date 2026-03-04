# Formulate — Roadmap

## ~~1. Email Deliverability~~ ✅
- [x] Verify `formulatetools.co.uk` domain in Resend (SPF, DKIM, DMARC)
- [x] Add DNS records at domain registrar (GoDaddy — DKIM, SPF, MX, DMARC all set)
- [x] Supabase SMTP sending from `hello@formulatetools.co.uk` via verified domain

## ~~2. Automated Testing~~ ✅
- [x] Set up Vitest + React Testing Library + jsdom
- [x] Auth error mapping tests (8 tests)
- [x] Worksheet conditional visibility tests (34 tests)
- [x] TextField + SelectField component tests with a11y (20 tests)
- [x] Delete account server action tests with mocked Supabase/Stripe (6 tests)
- [x] Homework form validation tests (9 tests)
- **77 tests total** — run with `pnpm test`

## ~~3. Onboarding & Empty States~~ ✅
- [x] Audit welcome modal (4-slide carousel — copy, links, steps all accurate)
- [x] Audit onboarding checklist (3-step funnel matches current features)
- [x] Audit guided tour — desktop targets all correct
- [x] Fix mobile guided tour (was completely broken — all 4 steps targeted hidden sidebar elements)
  - Added `data-tour` attributes to mobile tab bar items and "More" button
  - Tour now falls back to mobile targets when desktop targets are invisible
  - Mobile-specific copy for navigation and settings steps
- [x] Remove dead `exportedWorksheet` from ChecklistStatus interface
- [x] Audit empty states across all pages (dashboard, clients, worksheets — all present)
- **Existing onboarding was already comprehensive; fixes ensure mobile parity.**

## ~~4. Worksheet Builder Improvements~~ ✅
- [x] Field reordering (drag-and-drop within sections)
  - Native HTML5 DnD on fields with `e.stopPropagation()` to prevent section drag
  - Drag handle icon (grip bars) on each field header
  - Arrow buttons retained as mobile fallback
- [x] Section reordering (drag-and-drop)
  - Native HTML5 DnD on sections with drag handle icon
  - Arrow buttons retained as mobile fallback
- [x] Duplicate section/field
  - Deep clone utility (`clone-worksheet-elements.ts`) with full ID regeneration
  - Handles all field types: options, columns, formulation nodes/connections, record groups/sub-fields
  - Copy button in section and field header button groups
- [x] Live preview — already existed (right panel renders `<WorksheetRenderer>`)
- [x] Undo/redo support
  - Generic `useHistory<T>` hook with `useRef` stacks (max 50 snapshots)
  - Keyboard shortcuts: `Cmd/Ctrl+Z` (undo), `Cmd/Ctrl+Shift+Z` or `Cmd/Ctrl+Y` (redo)
  - Toolbar buttons (curved arrow icons) in builder header
  - Import/AI-draft flows reset history stack
- **5 files changed: `use-history.ts`, `clone-worksheet-elements.ts`, `custom-worksheet-builder.tsx`, `section-editor.tsx`, `field-editor.tsx`**

## ~~5. Monitoring & Observability~~ ✅
- [x] Created `src/lib/logger.ts` — structured logger wrapping console + Sentry
  - `logger.error` → `console.error` + `Sentry.captureException` (unexpected breakage)
  - `logger.warn` → `console.warn` + `Sentry.captureMessage` (handled/non-critical)
  - `logger.info` → `console.log` only (operational/debugging)
- [x] Replaced `console.error` with logger in 9 critical files:
  - Stripe webhook (5 calls: 1 error, 4 warn)
  - Resend webhook (1 error)
  - Homework submission route (9 calls: 5 error, 4 warn)
  - AI generate-worksheet + demo-generate (8 calls: 6 error, 2 warn)
  - Settings delete account action (10 calls: 2 error, 8 warn)
  - Client portal delete-response + Stripe portal routes (2 error)
  - Email utility (2 error)
- [x] Added `Sentry.captureException` to 6 segment error boundaries
  - `src/app/error.tsx`, `(dashboard)/error.tsx`, `(dashboard)/admin/error.tsx`
  - `(dashboard)/blog/error.tsx`, `(auth)/error.tsx`, `(marketing)/error.tsx`
  - Fixed `(auth)` and `(marketing)` which were missing `error` in destructuring
- [x] Health check endpoint already exists at `/api/health` (Supabase + Stripe + Resend)
- [x] Sentry alerting — configure at sentry.io dashboard post-deploy
- **37 console.error calls replaced across 9 files. All critical paths now report to Sentry.**

## ~~6. Mobile Experience~~ ✅
- [x] Full audit of all key pages at 375px viewport (iPhone SE)
- [x] Dashboard: grids stack to single column, plan card font sizes responsive
- [x] Client detail: header stacks vertically, action buttons wrap, label edit full-width
- [x] Share modal: buttons stack on mobile, responsive padding
- [x] Settings: all cards use responsive padding (p-4 → sm:p-6)
- [x] Worksheets: empty state padding responsive
- [x] Homework form: reassurance text bumped to 12px, download links wrap
- [x] Dashboard contributor section: flex wraps on mobile
- **Audited 6 pages, fixed issues across 6 files. No horizontal overflow or sub-44px tap targets.**

## ~~8. CI/CD Pipeline~~ ✅
- [x] Added `typecheck` script (`tsc --noEmit`) to `package.json`
- [x] Created `.github/workflows/ci.yml` — GitHub Actions workflow
  - Runs on push to `main` and pull requests
  - pnpm 10 + Node 22 with lockfile caching
  - Steps: `pnpm lint`, `pnpm typecheck`, `pnpm test`
- **Catches regressions automatically on every push and PR.**

## ~~9. Content Security Policy (CSP)~~ ✅
- [x] Added CSP with per-request nonces to `src/proxy.ts`
  - `buildCsp()` generates strict directive string with nonce
  - `applyCsp()` sets `Content-Security-Policy` + `x-nonce` headers
  - Applied to all page-route return paths (public, browse, protected, fallthrough)
  - API routes and redirects excluded (no HTML to protect)
- [x] Modified `src/app/layout.tsx` to read nonce from headers
  - `nonce={nonce}` on all 3 inline `<script>` tags (theme, JSON-LD × 2)
  - Layout made async to read request headers
- CSP directives: `default-src 'self'`, strict `script-src` with nonce, allowlists for Supabase/Stripe/Sentry/Vercel
- **XSS protection for a healthcare SaaS handling clinical data under GDPR.**

## 7. Legal Housekeeping
- [ ] ICO registration (legally required as data processor)
- [ ] Professional indemnity insurance review
- [ ] Solicitor review of terms and privacy policy
- [ ] Remove draft notices once legally reviewed
- **Why**: Ltd is registered; regulatory obligations follow.
