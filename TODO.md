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

## 4. Worksheet Builder Improvements
- [ ] Field reordering (drag-and-drop within sections)
- [ ] Section reordering
- [ ] Duplicate section/field
- [ ] Live preview (as client would see it)
- [ ] Undo/redo support
- **Why**: Creation UX is functional but basic. Power users need more flexibility.

## 5. Monitoring & Observability
- [ ] Structured logging for critical paths (homework submit, Stripe webhooks, auth)
- [ ] Sentry alerting rules for error spikes
- [ ] Health check endpoint
- [ ] Failed webhook retry visibility
- **Why**: Currently no way to know something is broken until a user reports it.

## 6. Mobile Experience
- [ ] Audit homework assignment flow on mobile/tablet
- [ ] Responsive pass on dashboard sidebar
- [ ] Client list and detail views on small screens
- [ ] Touch-friendly worksheet interactions
- **Why**: Therapists work from tablets between sessions.

## 7. Legal Housekeeping
- [ ] ICO registration (legally required as data processor)
- [ ] Professional indemnity insurance review
- [ ] Solicitor review of terms and privacy policy
- [ ] Remove draft notices once legally reviewed
- **Why**: Ltd is registered; regulatory obligations follow.
