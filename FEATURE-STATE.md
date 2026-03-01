# Formulate — State of All Features

> Generated 2026-03-01. For use as FAQ reference material.

---

## 1. Platform Overview

Formulate is a schema-driven CBT worksheet platform for therapists. Therapists build, assign, and review interactive clinical worksheets; clients complete them via anonymous token-based URLs. Built with Next.js 16 (App Router), React 19, Supabase (Postgres + Auth + RLS), Stripe, Resend, and Anthropic Claude.

**Live URL:** https://formulatetools.co.uk

---

## 2. Therapist-Facing Features

### 2.1 Dashboard (`/dashboard`)
- Overview cards: active clients, pending homework, recent submissions
- Categorised homework status: awaiting completion, completed (unreviewed), overdue
- Quick-assign flow from dashboard

### 2.2 Worksheet Library (`/worksheets`)
- Browse curated clinical worksheets with category filtering (`/worksheets/category/[slug]`)
- Worksheet detail pages with schema preview (`/worksheets/[slug]`)
- 4 batches of seeded worksheets (migrations 00021–00024) across CBT, anxiety, depression, trauma, OCD, safety planning, behavioural activation, and more
- Bookmark/favourite any worksheet

### 2.3 Custom Worksheet Builder (`/my-tools`)
- Visual drag-and-drop worksheet editor (`/my-tools/new`, `/my-tools/[id]/edit`)
- **16 field types supported:**
  - Basic: `text`, `textarea`, `number`, `date`, `time`, `select`
  - Clinical: `likert` (scales), `checklist`, `table`, `hierarchy` (graded exposure with gradient bars), `record` (multi-entry clinical records), `computed` (auto-calculated fields like belief change %)
  - Advanced: `formulation` (visual CBT diagrams), `decision_tree`, `safety_plan`
- Section-based layout with conditional visibility (`show_when` rules)
- Fork & customise any library worksheet
- AI worksheet generation via Claude (`/my-tools/ai`, `/api/generate-worksheet`)
- Import worksheets from description (`/api/import-worksheet`)
- Per-tier limits on custom worksheets (0 / 0 / 3 / 20)

### 2.4 Formulation Diagrams (within worksheets)
- Interactive visual CBT formulations embedded in worksheets
- **13 clinical templates:** Generic Five Areas, Health Anxiety, Panic Cycle, Social Anxiety, GAD (Metacognitive), PTSD (Ehlers & Clark), OCD Maintenance, Depression Maintenance, CBT-E (Eating), CFT Three Systems, Insomnia Maintenance, Chronic Pain Cycle, BDD Maintenance
- **5 layout patterns:** Cross-Sectional, Radial/Flower, Vertical Flow, Cycle, Three Systems
- Configurable colours, editable node fields, directional arrows
- Renders in worksheet, PDF export, and HTML export

### 2.5 Client Management (`/clients`)
- Add clients using pseudonymous labels (initials/codes only — PII validation enforced)
- Client detail view with assignment history (`/clients/[id]`)
- Soft-delete with cascade to assignments and responses

### 2.6 Homework Assignment & Review
- Assign any worksheet to a client via shareable anonymous link (`/hw/[token]`)
- Set due dates, pre-fill data, add therapist notes
- Track status: pending → in_progress → completed → reviewed
- Review completed submissions with therapist feedback
- Withdraw assignments
- Nudge reminders (automated + manual)
- Per-tier limits on active assignments (3 / 10 / ∞ / ∞)

### 2.7 Supervision Portal (`/supervision`)
- Add supervisees (Standard/Professional tiers)
- View supervisee's caseload and submissions (`/supervision/[id]`)
- Per-tier supervisee limits (0 / 0 / 4 / 8)

### 2.8 Export (3 formats)
- **Fillable PDF** (`fillable-pdf.ts`): A4 portrait, NHS-compliant margins, form fields via pdf-lib. Proportional column widths for wide tables. Supports all field types including formulation diagrams and hierarchy bars.
- **Interactive HTML** (`html-worksheet-export.ts`): Self-contained single-file HTML with localStorage persistence, print styles, record-add JS, XSS-escaped dynamic content. Warm cream/charcoal colour tokens.
- **PDF summary** (`pdf-export.ts`): Read-only summary PDF of completed responses with metadata header.

### 2.9 Content Contribution
- Contributor system for community worksheet submissions (`/content/[worksheetId]`)
- Admin review pipeline (`/admin/content`, `/admin/submissions`)
- Contributor profiles and agreement acceptance

### 2.10 Blog System (`/blog`)
- Full CMS: write, edit, publish posts (`/blog/write`)
- Categories, pagination, image upload
- Reaction system (likes/bookmarks via `/api/blog/reactions`)
- Blog digest emails (weekly cron)
- RSS feed (`/blog/feed.xml`)
- Embed worksheet references in posts (`/api/blog/worksheets-for-embed`)

### 2.11 Feature Requests (`/feature-requests`)
- Users can submit and vote on feature requests
- Admin dashboard view (`/admin/feature-requests`)

### 2.12 Referral System (`/referrals`)
- Unique referral codes per user
- Track referral signups and conversions
- Admin referral overview (`/admin/referrals`)

### 2.13 Settings (`/settings`)
- Account management, email preferences
- Subscription management (upgrade/downgrade/cancel via Stripe billing portal)
- Promo code redemption

---

## 3. Client-Facing Features

### 3.1 Homework Completion (`/hw/[token]`)
- Anonymous, no-login-required worksheet completion
- Token-based access (12-char nanoid, unguessable)
- Full worksheet renderer with all 16 field types
- Auto-save progress
- Mobile-responsive (16px minimum font to prevent iOS auto-zoom)

### 3.2 Consent Gate
- Informed consent screen before data entry
- Explains data handling, therapist access, retention policy
- Decline path offers PDF download instead (no data stored)
- Consent recorded with IP hash (HMAC-SHA256, non-reversible)

### 3.3 Client Portal (`/client/[portalToken]`)
- GDPR data access: view all submitted responses
- Per-response deletion (`/api/client-portal/delete-response`)
- Full account data deletion (`/api/client-portal/delete-all`)
- Portal tokens: 16-char nanoid, auto-generated on first assignment

### 3.4 Demo Experience (`/hw/demo/[slug]`)
- 3 pre-populated demo worksheets (7-Column Thought Record, Graded Exposure Hierarchy, Behavioural Activation Schedule)
- Example/Blank toggle
- No data saved

---

## 4. Public / Marketing Features

### 4.1 Landing Page (`/`)
- Hero section with animated feature highlights
- **Live AI demo**: visitors describe a worksheet and Claude generates it (1 free generation per IP per calendar month, rate-limited via `demo_generations` table + in-memory burst protection)
- "See what your client sees" — 3 tabbed interactive worksheet previews with pre-populated demo data
- Pricing section, testimonials, CTAs

### 4.2 Pricing Page (`/pricing`)
- 4 tiers: Free / Starter (£4.99/mo) / Practice (£9.99/mo) / Specialist (£19.99/mo)
- Annual billing with ~20% savings
- Feature comparison table
- Stripe Checkout integration

### 4.3 Static Pages
- Privacy Policy (`/privacy`) — GDPR-compliant, details data retention, clinical data handling
- Terms of Service (`/terms`)
- SEO: sitemap.xml, robots.txt, canonical URLs, web app manifest, Open Graph metadata, structured data (JSON-LD)

---

## 5. Subscription & Billing

### 5.1 Tiers & Limits

| | Free | Starter (£4.99) | Practice (£9.99) | Specialist (£19.99) |
|---|---|---|---|---|
| Monthly worksheet uses | 5 | ∞ | ∞ | ∞ |
| Clients | 3 | 5 | ∞ | ∞ |
| Active assignments | 3 | 10 | ∞ | ∞ |
| Custom worksheets | 0 | 0 | 3 | 20 |
| Supervisees | 0 | 0 | 4 | 8 |
| AI generations | — | 3/month | 10/month | ∞ |
| PDF branding | Formulate | Clean | Clean | Clean |

### 5.2 Stripe Integration
- Checkout session creation (`/api/checkout`) with CSRF protection
- Stripe webhook handler (`/api/webhooks/stripe`) for: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_failed`, `checkout.session.expired`
- Billing portal redirect for existing subscribers
- Promo codes with admin management (`/admin/promo-codes`)

### 5.3 Automated Emails (18 templates via Resend)
- Welcome email (deduplicated — `welcome_email_sent_at` column)
- Engagement email (re-engage inactive users)
- Homework completed notification (to therapist)
- Homework nudge (to client, via cron)
- Homework follow-up
- Subscription cancelled / payment failed / abandoned checkout
- Promo code expiry reminder
- Withdrawal notification
- Role granted (contributor/admin)
- Review assigned / content approved / content feedback
- Free tier monthly reset
- Submission status updates
- Blog digest (weekly)
- Blog post status (approved/rejected)

### 5.4 Cron Jobs (6 endpoints, Vercel cron)
- `/api/cron/homework-nudge` — sends reminders for overdue homework
- `/api/cron/data-retention` — purges soft-deleted records after 90 days (configurable)
- `/api/cron/engagement-email` — re-engages inactive users
- `/api/cron/free-reset-email` — notifies free users of monthly reset
- `/api/cron/promo-expiry-email` — warns about expiring promo codes
- `/api/cron/blog-digest` — weekly blog roundup

---

## 6. Security Features

### 6.1 Authentication & Authorisation
- Supabase Auth (Magic Link + Google OAuth)
- Role-based access: `user`, `contributor`, `admin`
- Middleware-level session refresh on every request
- Admin route protection (server-side role check)

### 6.2 Row-Level Security (RLS)
- 120+ RLS policies across 12+ migrations
- Every table has RLS enabled — users can only access their own data
- Service client (service_role key) bypasses RLS for anonymous homework flows and cron jobs
- Admin client for admin-only operations

### 6.3 CSRF Protection
- Origin header validation on checkout and sensitive API routes
- Strict equality check (`origin !== expectedOrigin`)

### 6.4 XSS Prevention
- HTML email templates: `esc()` function escapes `& < > " '`
- HTML worksheet export: `escHtml()` escapes all user content in dynamic JS
- `sanitize()` function for filenames in HTML export
- XML escaping in RSS feed

### 6.5 Webhook Security
- Stripe: signature verification via `constructEvent()`
- Resend: HMAC-SHA256 signature verification (Svix standard)
- Cron endpoints: timing-safe secret verification (`timingSafeEqual`)

### 6.6 Rate Limiting
- In-memory sliding window rate limiter (per Vercel Edge isolate)
- Route-specific limits: checkout (10/min), homework (30/min), demo-generate (3/min), image upload (10/min), blog reactions (30/min), import (5/min)
- Demo AI generation: DB-level 1/IP/month via `demo_generations` table + burst protection

### 6.7 Token Security
- Homework tokens: 12-char nanoid with unambiguous alphabet (~10²¹ combinations)
- Portal tokens: 16-char nanoid (~10²⁸ combinations)
- Preview URLs: HMAC-SHA256 signed with timing-safe comparison

### 6.8 Input Validation
- Client labels: PII pattern detection (emails, phones, NHS numbers, NI numbers, postcodes, dates of birth, common names) — prevents therapists from accidentally entering client PII
- Worksheet schema validation on custom worksheets
- Supervisee label validation
- Tier and period validation on checkout

---

## 7. Privacy & Compliance (GDPR)

### 7.1 Data Classification System (`data-classification.ts`)
- 4 levels: `clinical` (Art 9 special category), `pii`, `pseudonymous`, `operational`
- Every table/field mapped with classification and notes
- Referenced by DPIA documentation

### 7.2 PII Stripping (`strip-pii.ts`)
- Automatic PII removal before AI processing
- Detects and replaces: emails, phones, NHS numbers, NI numbers, UK postcodes, dates of birth, common names (including multi-word and ALL CAPS patterns)
- Excludes ambiguous standalone names that double as common English words (Mark, Grace, Dawn, etc.)

### 7.3 IP Address Handling (`ip-hash.ts`)
- One-way HMAC-SHA256 hash of IP addresses
- Server-side secret key prevents rainbow table reversal
- Consent audit trail without storing raw IPs

### 7.4 Client Data Access & Deletion
- Client portal: view all personal data (`/client/[portalToken]`)
- Per-response deletion (Art 17 right to erasure)
- Full account data deletion with GDPR cascade
- Soft-delete with 90-day retention before permanent purge

### 7.5 Data Retention
- Configurable retention period (default 90 days)
- Automated cron-based purge of soft-deleted records
- Audit trail logged for every purge run
- Foreign-key-safe deletion order (leaf tables first)

### 7.6 Consent Management
- Explicit informed consent before data entry (consent gate)
- Consent records table with timestamps
- Terms acceptance tracking (migration 00013)
- Privacy policy with detailed data handling information

### 7.7 Audit Logging (`audit.ts`)
- Append-only audit log (no updates or deletes permitted)
- Tracks: create, read, update, delete, export, login, logout, assign, share, redeem
- Linked to user ID with entity type/ID and JSON metadata

### 7.8 Pseudonymous Client Identifiers
- Clients identified by codes/initials only (never full names or emails)
- PII validation on client label input prevents accidental data entry
- Therapeutic relationships linked by pseudonymous labels

---

## 8. Admin Features (`/admin`)

- **Dashboard**: platform stats overview
- **User management** (`/admin/users`): view all users, user detail with subscription/role/activity (`/admin/users/[id]`), grant roles, manage tiers
- **Revenue** (`/admin/revenue`): Stripe revenue analytics
- **Worksheet management**: edit library worksheets (`/admin/worksheets/[slug]/edit`), create new (`/admin/worksheets/new`)
- **Submissions** (`/admin/submissions`): review community worksheet submissions, approve/reject with feedback
- **Content review** (`/admin/content`): review contributed worksheet content
- **Blog management** (`/admin/blog`): moderate blog posts, review submissions
- **Promo codes** (`/admin/promo-codes`): create/manage promotional codes
- **Feature requests** (`/admin/feature-requests`): view and manage user feature requests
- **Referrals** (`/admin/referrals`): track referral programme

---

## 9. Technical Infrastructure

- **Hosting**: Vercel (CLI deploys, not GitHub auto-deploy)
- **Database**: Supabase PostgreSQL with 27 migrations
- **Auth**: Supabase Auth (Magic Link + Google OAuth)
- **Payments**: Stripe (Checkout + Billing Portal + Webhooks)
- **Email**: Resend with webhook delivery tracking
- **AI**: Anthropic Claude API for worksheet generation
- **Error tracking**: Sentry
- **Font**: DM Sans
- **Design tokens**: Amber (#e4a930) + Charcoal (#2d2d2d)
- **Package manager**: pnpm
- **Framework**: Next.js 16, React 19, Tailwind v4 (CSS-based config)

---

## 10. Planned / Not Yet Implemented

### 10.1 Formulation Layout Patterns
- All 5 patterns are implemented and available (cross_sectional, radial, vertical_flow, cycle, three_systems). No "Coming soon" patterns remain.

### 10.2 Phase 2 Types (Scaffolded in TypeScript)
- `PrefillData` interface defined — prefill functionality is implemented (migration 00020)
- `WorksheetAssignment` fully typed and in use
- Additional assignment fields (`locked_at`, `withdrawn_at`, `completion_method`, `pdf_downloaded_at`) are typed and implemented

### 10.3 Database Migrations Not Yet Applied
- `00026_welcome_email_dedup.sql` — adds `welcome_email_sent_at` column to profiles (prevents duplicate welcome emails)
- `00027_demo_generations.sql` — creates `demo_generations` table for IP-based rate limiting of the landing page AI demo

### 10.4 Environment Variable Pending
- `RESEND_WEBHOOK_SECRET` — needed for Resend webhook signature verification (endpoint exists, gracefully falls back if not set)

### 10.5 Potential Future Enhancements (inferred from codebase patterns)
- Outcome measures / EMA (Ecological Momentary Assessment): `measure_administrations` and `ema_responses`/`ema_schedules` tables referenced in data retention cron but not yet actively used in the UI
- Email preferences management: `showPreferencesLink` option exists in email template wrapper but not all emails use it
- Analytics dashboard for therapists: `analytics` table exists (migration 00010) — admin-level analytics present but therapist-level insights not exposed

### 10.6 Encrypted Client Email for Homework Reminders (Proposed)
- **Goal**: Send automated homework reminders to clients without storing plaintext email addresses
- **Approach**: AES-256-GCM envelope encryption — client email encrypted at point of entry, ciphertext + IV + auth tag stored in a `client_contacts` table, plaintext never hits the database
- **Send flow**: Cron decrypts in-memory → sends via Resend → discards plaintext immediately
- **Key management**: `EMAIL_ENCRYPTION_KEY` env var (32-byte), with `key_version` column for future rotation
- **GDPR benefit**: Satisfies Art 25 (data protection by design) and Art 32 (security). DB breach yields only unintelligible ciphertext — may remove Art 34 notification obligation. Right to erasure = delete the ciphertext row.
- **Legal basis**: Legitimate interest (Art 6(1)(f)) or explicit consent at the consent gate
- **Status**: Not yet built — design documented, awaiting prioritisation

---

*End of feature state document.*
