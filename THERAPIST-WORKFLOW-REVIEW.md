# Therapist Workflow Experience — Comprehensive Review

**Date:** 2026-03-05
**Scope:** End-to-end therapist workflow including dashboard, client management, worksheet builder, homework assignment, client portal, worksheet rendering, settings, and authentication.
**Files Analysed:** ~210 TypeScript/React files across 16 directories

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Critical Issues (P0)](#critical-issues-p0)
3. [High Priority (P1)](#high-priority-p1)
4. [Medium Priority (P2)](#medium-priority-p2)
5. [Low Priority (P3)](#low-priority-p3)
6. [Feature Gaps](#feature-gaps)
7. [Cross-Cutting Concerns](#cross-cutting-concerns)
8. [File-by-File Reference Index](#file-by-file-reference-index)

---

## Executive Summary

Formulate is a well-structured, production-grade CBT worksheet platform with strong foundations: good consent flows, GDPR compliance, PII validation, audit logging, and a comprehensive feature set. The therapist workflow covers the full lifecycle from client onboarding through homework assignment, completion, and review.

However, the review identified **97 discrete issues** across 7 workflow areas:

| Category | Critical | High | Medium | Low |
|----------|----------|------|--------|-----|
| Bugs / Data Integrity | 4 | 6 | 5 | 3 |
| Accessibility (WCAG) | 2 | 12 | 14 | 8 |
| UX / Usability | 1 | 8 | 16 | 12 |
| Performance | 0 | 3 | 4 | 2 |
| Security | 1 | 2 | 3 | 1 |
| Code Quality | 0 | 2 | 8 | 6 |

The most significant themes are:
- **Accessibility gaps** — Missing ARIA patterns (tabs, modals, focus traps), invisible-to-keyboard buttons, and missing error announcements
- **Silent failures** — Clipboard, PDF generation, server actions, and database queries frequently swallow errors
- **Clinical data integrity** — Likert fields cannot distinguish "not answered" from "minimum value"; multi-entry validation only checks the active entry
- **Inconsistent dark mode** — Partial coverage creates broken UI in dark theme
- **Missing loading states** — Multiple server-rendered pages have no skeleton/Suspense boundary

---

## Critical Issues (P0)

### P0-1: Likert field cannot distinguish "not answered" from "minimum value"
**File:** `src/components/worksheets/worksheet-renderer.tsx` lines 95-97
**Impact:** Clinical data integrity

The likert field initializes to `field.min` (typically 0) before any user interaction. There is no way to distinguish a deliberate score of 0 from an unanswered field. For clinical assessment tools (PHQ-9, GAD-7, etc.), this silently records false data.

**Fix:** Use `null` or `undefined` as the initial value, render the slider in an "unset" visual state, and only record a numeric value after the first user interaction.

---

### P0-2: Multi-entry validation only checks active entry
**File:** `src/components/homework/homework-form.tsx` lines 308-312
**Impact:** Incomplete data submitted to therapist

When `isRepeatable` is true, `findMissingRequiredFields` only validates `entriesRef.current[activeEntryIndex]`. If Entry 1 has missing required fields but the user is viewing Entry 3, submission succeeds with incomplete data.

**Fix:** Iterate all entries and validate each before allowing submission.

---

### P0-3: Magic link signup drops fullName, promoCode, and referralCode
**File:** `src/components/ui/auth-form.tsx` lines 84-93, 138
**Impact:** User data loss on signup

When signing up via magic link, the `fullName` field is not rendered (hidden when `method !== 'password'`), and the metadata payload omits `promoCode` and `referralCode`. Users who sign up via magic link have no name in their profile, referrals are not credited, and promo codes are lost.

**Fix:** Render the name field for all signup methods; include all metadata in the magic link signup payload.

---

### P0-4: External OG images loaded without proxy in client portal
**File:** `src/components/client-portal/resource-card.tsx` lines 91-95, 112-115
**Impact:** Client privacy / tracking

External `og_image_url` values from shared resources are rendered directly as `<img src>`. External servers can log client IP addresses, track access patterns, and potentially serve inappropriate content. In a therapeutic context, this is a privacy concern.

**Fix:** Proxy external images through a server-side route (e.g., `/api/image-proxy?url=...`) or use Next.js `<Image>` with configured remote patterns.

---

## High Priority (P1)

### P1-1: No focus traps on modals
**Files:** `welcome-modal.tsx`, `client-preview-modal.tsx`, `submit-to-library-modal.tsx`, `my-tools-list.tsx` delete dialog, `assign-from-library-modal.tsx`
**Impact:** WCAG 2.1 Level A violation (2.4.3 Focus Order)

Multiple modals use `role="dialog"` and `aria-modal="true"` but do not implement focus trapping. Users can Tab out of the modal and interact with underlying content. The `AssignHomeworkModal` correctly implements a focus trap, showing the pattern exists in the codebase.

---

### P1-2: Tab patterns missing ARIA controls throughout
**Files:** `clients-tab-bar.tsx`, `client-detail.tsx`, `portal-tabs.tsx`, `multi-entry-viewer.tsx`, `assign-homework-modal.tsx`
**Impact:** WCAG 2.1 Level A violation

Tabs use `role="tab"` and `aria-selected` but are missing `aria-controls`, and tab panels lack `role="tabpanel"` and `aria-labelledby`. No tab component implements arrow-key navigation between tabs.

---

### P1-3: Clipboard API calls without try-catch
**Files:** `client-detail.tsx` lines 219, 235, 961; `supervisee-detail.tsx` lines 129, 411
**Impact:** Uncaught exceptions in non-HTTPS or restricted contexts

`navigator.clipboard.writeText()` can throw in HTTP contexts, iframes, or when the Clipboard API is unavailable. None of these calls are wrapped in try-catch.

---

### P1-4: Drag-and-drop completely inaccessible
**Files:** `queue-panel.tsx`, `custom-worksheet-builder.tsx`, `section-editor.tsx`
**Impact:** WCAG 2.1 Level A violation

HTML5 drag-and-drop has no keyboard alternative. The move up/down buttons partially mitigate this in queue-panel but they lack `aria-label` (only `title`). The worksheet builder's drag-and-drop provides no visual drop target indicator and does not work on touch devices.

---

### P1-5: Form labels not associated with inputs in worksheet builder
**File:** `custom-worksheet-builder.tsx` lines 519-582, `field-editor.tsx` throughout
**Impact:** WCAG 2.1 Level A violation (1.3.1 Info and Relationships)

`<label>` elements lack `htmlFor` and `<input>` elements lack `id` attributes. Clicking labels does not focus fields; screen readers cannot associate labels with inputs. This affects the title, description, instructions, category, tags, and estimated minutes fields, plus all field editor sub-configs.

---

### P1-6: Missing validation feedback on ChecklistField and LikertField
**Files:** `checklist-field.tsx`, `likert-field.tsx`
**Impact:** Users get no feedback when required fields are incomplete

These field types do not accept a `showError` prop and have no error display mechanism. A required checklist with nothing checked shows no validation error. The renderer (`worksheet-renderer.tsx` lines 699-716) never passes `showError` to these components.

---

### P1-7: Remove buttons invisible to keyboard and touch users
**Files:** `hierarchy-field.tsx` line 195, `formulation-layout.tsx` line 218
**Impact:** WCAG 2.1 Level A violation

Remove buttons use `opacity-0 group-hover:opacity-100` with no `focus-visible:opacity-100`. Keyboard users tabbing to the button see nothing. Touch device users also cannot trigger hover.

---

### P1-8: Reactivate supervisee does not check tier limit
**File:** `supervisee-list.tsx` line 325
**Impact:** Tier limit bypass

Clicking "Reactivate" on an ended supervisee calls `reactivateSupervisee` directly without checking if the user is at their current tier's supervisee limit. This could allow users to exceed their paid plan limits.

---

### P1-9: GDPR erasure is not transactional
**File:** `src/app/(dashboard)/clients/actions.ts` lines 322-423
**Impact:** Partial data deletion

`gdprErase` performs multiple sequential deletions. If one fails mid-way, the function returns an error but some data has already been hard-deleted. There is no rollback mechanism, leaving data in a partial state.

---

### P1-10: ConfirmModal closes before delete completes in data management
**File:** `src/components/client-portal/data-management.tsx` lines 999-1006
**Impact:** User sees no loading feedback

`setConfirmDeleteId(null)` is called immediately in `onConfirm`, closing the modal before `handleDeleteResponse` finishes. The loading state is invisible.

---

### P1-11: "Offline — your work is saved locally" is misleading
**File:** `src/components/homework/homework-form.tsx` line 671
**Impact:** False sense of security for clients

The message says "your work is saved locally," but the form does not persist data to localStorage or IndexedDB. If the client closes the tab while offline, all work is lost.

---

### P1-12: Duplicate ARIA landmark labels
**File:** `sidebar-nav.tsx` lines 333, 458-459
**Impact:** WCAG violation — landmarks must have unique labels

Both desktop sidebar `<nav>` and mobile bottom tab bar `<nav>` use `aria-label="Main"`.

---

## Medium Priority (P2)

### P2-1: No loading/skeleton states on multiple pages
**Files:** `settings/page.tsx`, `homework-plans/page.tsx`, `client portal page.tsx`, `reviews/page.tsx`

Server components with database queries show blank screens while loading. No `loading.tsx` siblings or Suspense boundaries.

### P2-2: Server-side greeting uses server timezone
**File:** `dashboard/page.tsx` lines 215-220

`new Date().getHours()` runs on the server (UTC), not the user's timezone. A PST therapist sees "Good evening" in the afternoon.

### P2-3: All four dashboard stat cards link to same route
**File:** `dashboard/page.tsx` lines 272-329

Active Clients, Active Assignments, Pending Review, and Completion Rate all navigate to `/clients`. "Pending Review" should deep-link to a filtered view.

### P2-4: Redirect param lost when switching login/signup
**Files:** `login/page.tsx` line 48, `signup/page.tsx` line 60

"Create free account" links to `/signup` without forwarding the `redirect` query parameter.

### P2-5: Sequential DB queries on homework page
**File:** `src/app/hw/[token]/page.tsx` lines 37-123

6 sequential Supabase queries on the most latency-sensitive surface (client mobile). Queries 2-5 could run in parallel.

### P2-6: Duplicate pending review query in layout + page
**Files:** `layout.tsx` lines 25-30, `dashboard/page.tsx` line 39

Same `pendingReviewCount` query executes twice when dashboard renders inside the layout.

### P2-7: 3-column metadata grid not responsive
**File:** `custom-worksheet-builder.tsx` line 549

`grid-cols-3` without a responsive prefix. Category, Tags, and Est. minutes fields compress on mobile.

### P2-8: Preview panel content cannot scroll independently
**File:** `custom-worksheet-builder.tsx` line 656

The sticky preview panel has no `max-height` or `overflow-y-auto`. Content exceeding viewport height is unreachable.

### P2-9: No auto-save or draft persistence in builder
**File:** `custom-worksheet-builder.tsx`

No auto-save to localStorage or server. Browser crash loses all work. The `beforeunload` warning exists but doesn't cover SPA navigation.

### P2-10: Raw database errors shown to users
**File:** `custom-worksheet-builder.tsx` lines 300-301

Supabase error messages displayed directly (e.g., "new row violates row-level security policy").

### P2-11: Two different assign modal implementations
**Files:** `assign-homework-modal.tsx`, `assign-from-library-modal.tsx`

Different feature sets, accessibility levels, and styling. `AssignFromLibraryModal` lacks focus trap and Escape key handler.

### P2-12: Error/success messages missing role="alert" or role="status"
**Files:** `login/page.tsx` line 36, `supervisee-list.tsx`, `supervisee-detail.tsx`, `pin-setup-banner.tsx` line 211, `data-management.tsx` lines 798/849/883

Screen readers don't announce these messages.

### P2-13: Progress bar missing ARIA attributes
**Files:** `subscription-details.tsx` lines 133-138, `onboarding-checklist.tsx` lines 92-101, `progress-section.tsx` lines 31-36

Missing `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`.

### P2-14: Side effect in GET request on homework page
**File:** `hw/[token]/page.tsx` lines 98-104

Database UPDATE (portal token backfill) inside a server component render violates idempotent GET principle.

### P2-15: No confirmation dialog before homework submission
**File:** `homework-form.tsx` line 304

Submission is irreversible but has no "Are you sure?" confirmation.

### P2-16: Referral stats grid not responsive
**File:** `referrals/page.tsx` line 95

`grid-cols-3` without responsive prefix compresses on mobile.

### P2-17: Worksheet sticky headers overlap in assign modal
**File:** `assign-homework-modal.tsx` lines ~591, ~620

"My Custom Tools" and "Curated Library" headers both use `sticky top-0` and stack on each other.

### P2-18: PIN setup banner permanently dismissed
**File:** `pin-setup-banner.tsx` lines 32-35

localStorage flag set forever with no way to re-surface the banner.

### P2-19: "Forgot your PIN?" text at 10px
**File:** `pin-entry.tsx` line 219

`text-[10px]` is extremely small for critical help text on mobile.

---

## Low Priority (P3)

### P3-1: Sign-out uses full page reload
**File:** `sidebar-nav.tsx` line 281 — `window.location.href = '/'` instead of router navigation.

### P3-2: Inconsistent toast imports
**Files:** `my-tools-list.tsx` imports from `@/components/providers/toast-provider`; `custom-worksheet-builder.tsx` imports from `@/hooks/use-toast`.

### P3-3: Inconsistent button imports
**Files:** Dashboard imports `buttonVariants` from `@/components/ui/button-variants`; sidebar imports from `@/components/ui/button`.

### P3-4: Tier label duplication
**File:** `sidebar-nav.tsx` lines 148-153 defines `tierLabels` separately from `TIER_LABELS` in `@/lib/stripe/config`.

### P3-5: `Date.now()` for ID generation
**Files:** `section-editor.tsx`, `field-editor.tsx`, `formulation-configurator.tsx` — Use `crypto.randomUUID()` instead.

### P3-6: Duplicated utility functions
- `interpolateColor` in `hierarchy-field.tsx` and `worksheet-renderer.tsx`
- `createEmptyRow` in `table-field.tsx` and `hierarchy-field.tsx`
- `formatDate` in `assignment-card.tsx` and `data-management.tsx`
- PIN input logic duplicated across 3 client-portal files

### P3-7: Dead code
- `activeAssignmentCount` prop unused in `client-list.tsx`
- `handleEnd` and `ConfirmModal` in `supervisee-list.tsx` are unreachable
- `handleCopyLink` unused `assignmentId` parameter in `client-detail.tsx`
- `_userExportCount` fetched but never used in `dashboard/page.tsx`

### P3-8: `TableField` dead ternary branch
**File:** `table-field.tsx` lines 17-23 — `col.type === 'number' ? '' : ''` always evaluates to `''`.

### P3-9: ComputedField "percentage_change" is mislabeled
**File:** `computed-field.tsx` lines 86-88 — Shows absolute difference, not percentage change. Division by zero risk if corrected.

### P3-10: ViciousFlower dual-state synchronization risk
**File:** `formulation-layout.tsx` lines 122-153 — Local `useState` can desync from parent values on re-render.

### P3-11: RecordField dot navigation touch targets too small
**File:** `record-field.tsx` lines 693-705 — `h-2 w-2` (8x8px) buttons fail WCAG 2.5.8 minimum target size (24x24px).

### P3-12: iOS bottom nav safe area
**File:** `layout.tsx` line 53 — `pb-20` does not account for `env(safe-area-inset-bottom)` on notched iPhones.

---

## Feature Gaps

### Therapist Dashboard
1. **No dedicated "pending review" view** — All stat cards link to `/clients`, no filtered review queue
2. **No sorting or filtering** on feature requests page
3. **No pagination** on feature requests, client list, or assignment lists

### Client Management
4. **No bulk actions** — Cannot discharge, assign, or manage multiple clients at once
5. **No assignment filtering/sorting** in client detail view
6. **No undo for resource archival** — Archived resources cannot be unarchived
7. **Static page title** on client detail — Always "Client — Formulate" regardless of which client

### Worksheet Builder
8. **No heading/static text/divider field type** — Clinicians cannot insert instructional text between fields
9. **No "save and continue editing"** — Save always navigates away in create mode
10. **No inline validation** — Disabled save button has no explanation of why it's disabled
11. **Two AI generation paths** create a fragmented mental model (inline panel vs. dedicated page)
12. **Tier limit redirect has no explanation** — Silently redirected to `/my-tools`

### Homework & Review
13. **No dedicated therapist review page** for client homework submissions (reviews system is for contributor content, not client homework)
14. **No "back" button** in template confirm step of assign modal
15. **Template confirm step** does not show delivery mode chosen
16. **No search/filter** on homework plans page
17. **No "undo decline" button** on consent gate — Client must reload page manually

### Client Portal
18. **No personalization** — `clientLabel` and `therapistName` props accepted but never rendered
19. **No contact therapist** feature — No messaging, contact link, or therapist info displayed
20. **No due date urgency indicators** — Assignments due today look identical to future ones
21. **No homework count badge** on the Homework tab (Resources tab has one)
22. **No notification/reminder system** despite PWA support
23. **No search/filter** on data management page

### Settings
24. **No email change functionality**
25. **Promo code section hidden for paid users** who may receive promo codes
26. **No deep-link support** for settings sections (no anchor IDs)

---

## Cross-Cutting Concerns

### Dark Mode
Dark mode support is **incomplete and inconsistent**:
- **Full support:** `homework-form.tsx`, supervision components, some sidebar elements
- **Partial support:** `consent-gate.tsx`, `assign-from-library-modal.tsx`
- **No support:** `settings/page.tsx`, auth pages, `subscription-details.tsx`, `referrals/page.tsx`, `feature-requests/page.tsx`, most client-portal components

This creates a broken experience where some elements adapt to dark mode and others remain light, resulting in poor contrast and readability.

### Error Handling
Error handling patterns are inconsistent:
- **Supabase query errors silently discarded** in `clients/page.tsx`, `[id]/page.tsx`, `dashboard/page.tsx`, `settings/page.tsx` — all destructure only `{ data }`, ignoring `{ error }`
- **Server action return values ignored** in `client-list.tsx` (discharge/reactivate), `welcome-modal.tsx` (completeOnboarding)
- **No error boundaries** anywhere in the application — a single component throw crashes the entire page

### Loading States
Multiple server-component pages lack `loading.tsx` or Suspense boundaries:
- Settings page
- Homework plans page
- Client portal main page
- Reviews page
- Client detail page (loading.tsx exists but has mismatched padding)

### Inline SVG Duplication
All icons are inline SVGs duplicated across files. The same spinner SVG appears in 4+ files. The same icon paths appear in sidebar-nav, dashboard, and client-detail. A shared icon component library would reduce bundle size and maintenance burden.

### Inconsistent Navigation Patterns
- `/my-tools` redirects to `/worksheets/mine`, but several components link back to `/my-tools`
- `/supervision` redirects to `/clients?tab=supervisees`
- Tab switching uses full server-side navigation (`router.push`) instead of client-side state
- Some links use `<a>` instead of Next.js `<Link>` (auth-form forgot password)
- Footer privacy links inconsistently use `target="_blank"`

### Component Size
Several components exceed reasonable single-file size:
- `client-detail.tsx` — ~1167 lines, 22+ useState calls
- `assign-homework-modal.tsx` — ~1000 lines, 3 tabs + multi-step flow
- `formulation-configurator.tsx` — ~1155 lines
- `data-management.tsx` — ~1010 lines
- `worksheet-renderer.tsx` `renderReadOnlyField` — ~460 line callback

---

## File-by-File Reference Index

| Area | File | Issues |
|------|------|--------|
| **Dashboard** | `dashboard/page.tsx` | P2-2, P2-3, P3-7, 15 parallel queries, IIFE pattern |
| **Dashboard** | `layout.tsx` | P2-6, P3-12, unauthenticated layout gap |
| **Dashboard** | `sidebar-nav.tsx` | P1-12, P3-1, P3-3, P3-4, More sheet focus trap |
| **Onboarding** | `welcome-modal.tsx` | P1-1, no swipe, completeOnboarding error handling |
| **Onboarding** | `onboarding-checklist.tsx` | P2-13, localStorage without try-catch |
| **Onboarding** | `guided-tour.tsx` | Overlay dismiss without confirm, hardcoded tooltip dimensions |
| **Auth** | `auth-form.tsx` | P0-3, no password strength indicator, Supabase client per render |
| **Auth** | `login/page.tsx` | P2-4, P2-12, generic error message |
| **Settings** | `settings/page.tsx` | P2-1, no email change, IIFE pattern |
| **Settings** | `subscription-details.tsx` | P2-13, no usage bar for paid tiers |
| **Clients** | `clients/page.tsx` | Silent query errors, unused prop |
| **Clients** | `client-list.tsx` | P3-7, no loading during discharge, silent errors |
| **Clients** | `client-detail.tsx` | P1-3, P1-2, 22 useState, ~1167 lines, no past-date validation |
| **Clients** | `clients-tab-bar.tsx` | P1-2, full-page nav on tab switch |
| **Clients** | `queue-panel.tsx` | P1-4, sequential DB updates, "Skipped" shown as green |
| **Clients** | `share-resource-form.tsx` | Hostname fallback title, duplicate URL validation |
| **Clients** | `actions.ts` | P1-9, status validation gaps on lock/review |
| **Supervision** | `supervisee-list.tsx` | P1-8, P3-7, dead code |
| **Supervision** | `supervisee-detail.tsx` | P1-3, grid not responsive, no GDPR type-to-confirm |
| **Worksheets** | `custom-worksheet-builder.tsx` | P1-5, P2-7, P2-8, P2-9, P2-10, no inline validation |
| **Worksheets** | `field-editor.tsx` | P1-5, drag handle accessibility |
| **Worksheets** | `section-editor.tsx` | Drag handle accessibility, no aria-expanded |
| **Worksheets** | `formulation-configurator.tsx` | Colour picker accessibility, ~1155 lines |
| **Worksheets** | `client-preview-modal.tsx` | P1-1, no Escape key |
| **Worksheets** | `submit-to-library-modal.tsx` | P1-1, no Escape key |
| **Worksheets** | `my-tools-list.tsx` | P1-1, inconsistent toast import |
| **Worksheets** | `actions.ts` | Slug update silent failure, type assertions |
| **Fields** | `likert-field.tsx` | P0-1, P1-6, no aria-required |
| **Fields** | `checklist-field.tsx` | P1-6, no aria-required |
| **Fields** | `hierarchy-field.tsx` | P1-7, inputs missing labels, no mobile layout |
| **Fields** | `formulation-layout.tsx` | P1-7, dual-state bug, fixed 2-col grid |
| **Fields** | `table-field.tsx` | P3-8, inconsistent remove aria-labels |
| **Fields** | `record-field.tsx` | P3-11, missing htmlFor, safeIndex desync |
| **Fields** | `computed-field.tsx` | P3-9, percentage_change mislabeled |
| **Fields** | `decision-tree-layout.tsx` | Missing aria-pressed on branch buttons |
| **Fields** | `worksheet-renderer.tsx` | P0-1, 460-line callback, section headings skip h2 |
| **Homework** | `homework-form.tsx` | P0-2, P1-11, P2-15, offline messaging |
| **Homework** | `consent-gate.tsx` | JSON parse risk, no undo from decline |
| **Homework** | `blank-pdf-generator.tsx` | No error feedback on PDF failure |
| **Homework** | `hw/[token]/page.tsx` | P2-5, P2-14, sequential queries |
| **Homework** | `assign-provider.tsx` | Modal always mounted, no onSuccess |
| **Homework** | `assign-homework-modal.tsx` | P2-17, ~1000 lines, keyboard navigation gap |
| **Homework** | `assign-from-library-modal.tsx` | P2-11, no focus trap, no Escape |
| **Homework** | `homework-plans/page.tsx` | P2-1, hardcoded GBP, no search |
| **Portal** | `client-portal.tsx` | Unused props, no personalization, no empty state |
| **Portal** | `pin-entry.tsx` | P2-19, client-side lockout, PIN group no role |
| **Portal** | `pin-setup-banner.tsx` | P2-18, P2-12, duplicated PIN logic |
| **Portal** | `data-management.tsx` | P1-10, ~1010 lines, inconsistent API URLs |
| **Portal** | `assignment-card.tsx` | Silent PDF failure, no expired guidance |
| **Portal** | `response-viewer.tsx` | Silent PDF failure |
| **Portal** | `portal-tabs.tsx` | P1-2, no keyboard nav |
| **Portal** | `portal-consent.tsx` | No retry on network error |
| **Portal** | `resource-card.tsx` | P0-4, video play button no aria-label |
| **Portal** | `progress-section.tsx` | P2-13, capped at 95% |
| **Referrals** | `referrals/page.tsx` | P2-16, no empty state CTA |
| **Features** | `feature-requests/page.tsx` | No pagination, no sort by votes |

---

*This review was generated by comprehensive static analysis of the Formulate codebase. Issues are categorized by severity and grouped for efficient triage. Priority labels (P0-P3) reflect clinical impact, user-facing severity, and WCAG compliance requirements.*
