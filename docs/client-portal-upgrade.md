# Formulate — Client Portal Upgrade Spec

> **Purpose:** Upgrade the existing client portal (`/client/[portalToken]`) from a GDPR compliance backstop into a useful client-facing dashboard. The data layer, token system, and deletion flows already exist. This spec covers the frontend experience, therapist-side integration, and the opt-in flow.

> **Existing infrastructure (no changes needed):**
> - Portal tokens: 16-char nanoid, auto-generated on first assignment
> - `/client/[portalToken]` route exists
> - Per-response deletion (`/api/client-portal/delete-response`)
> - Full account deletion (`/api/client-portal/delete-all`)
> - Consent gate with IP hash logging

---

## Agreed Design Decisions

> These were agreed during spec review (2026-03-01):
>
> 1. **No "Reviewed by therapist" badge.** Default to `✓ Completed` for all completed assignments. Revealing therapist review activity could create anxiety or expectations around response time.
> 2. **Therapist notes are NOT client-facing.** Do not show `assignments.therapist_notes` on portal cards. May revisit later with a dedicated "message to client" field.
> 3. **No due date urgency colouring.** Show due dates if set, but no amber/red indicators. Homework non-completion is a therapeutic conversation, not a failure state.
> 4. **Hard delete from portal.** Client-initiated deletion is permanent (hard delete), not soft-delete. The language "permanently delete... cannot be undone" must be accurate.
> 5. **Service worker scoped to `/client/`.** Prevents conflict with any future therapist-side service worker.
> 6. **Two portal statuses only.** Drop `portal_link_copied_at` tracking. Therapist sees: "Not yet activated" (no client consent) or "Active" (client consented). Simpler, more honest.
> 7. **Bookmark prompt is primary.** Show a dismissible bookmark banner on first post-consent visit. PWA install prompt is secondary (mobile only, shown after bookmark prompt).
> 8. **Simple offline page in service worker.** Cache a basic "You're offline" page so PWA users see something useful without internet.
> 9. **Progress section: positive only.** Show completed count only. No implied denominator, no percentage, no "X of Y" framing.

---

## 1. What the Client Sees

### 1.1 Portal Landing Page (`/client/[portalToken]`)

The page has three states depending on whether the client has accepted the portal terms.

**State A: First visit (no portal consent yet)**

```
+-----------------------------------------------------+
|  [Formulate logo]                                    |
|                                                      |
|  Your Therapy Workspace                              |
|                                                      |
|  Your therapist has set up a personal space for      |
|  you to view and complete your therapy homework.     |
|                                                      |
|  From here you can:                                  |
|  - See all your current and past assignments         |
|  - Complete homework at your own pace                |
|  - Look back at previous responses                   |
|  - Delete any of your data at any time               |
|                                                      |
|  +---------------------------------------------+    |
|  | How your data is handled                     |    |
|  |                                              |    |
|  | - You are identified by a code, not your     |    |
|  |   name                                       |    |
|  | - Only your therapist can see your responses  |    |
|  | - Your data is encrypted and stored securely  |    |
|  | - You can delete any or all of your data at   |    |
|  |   any time                                    |    |
|  | - This link is private -- don't share it      |    |
|  +---------------------------------------------+    |
|                                                      |
|  By continuing you agree to our Privacy Policy       |
|  and Terms of Use.                                   |
|                                                      |
|  [Continue to My Workspace]    [No thanks]           |
|                                                      |
+-----------------------------------------------------+
```

"No thanks" dismisses the page. The client can still complete individual homework via direct `/hw/[token]` links as before. The portal is additive, never a gate.

"Continue to My Workspace" records portal consent (timestamp + IP hash) and shows State B.

**State B: Active portal (consent given, assignments exist)**

```
+-----------------------------------------------------+
|  [Formulate logo]              [Manage my data (gear)]|
|                                                      |
|  Your Therapy Workspace                              |
|  --------------------- (amber rule)                  |
|                                                      |
|  +- Current Homework ----------------------------+   |
|  |                                                |   |
|  |  7-Column Thought Record                       |   |
|  |  Assigned 28 Feb . Due 4 Mar                   |   |
|  |  (circle) Not started                          |   |
|  |  [Open ->]                                     |   |
|  |                                                |   |
|  |  Panic Diary                                   |   |
|  |  Assigned 25 Feb . Due 3 Mar                   |   |
|  |  (half) In progress (auto-saved)               |   |
|  |  [Continue ->]                                 |   |
|  |                                                |   |
|  +------------------------------------------------+   |
|                                                      |
|  +- Completed ------------------------------------+   |
|  |                                                |   |
|  |  Behavioural Activation Schedule               |   |
|  |  Completed 22 Feb . (tick) Completed           |   |
|  |  [View my responses]                           |   |
|  |                                                |   |
|  |  Graded Exposure Hierarchy                     |   |
|  |  Completed 15 Feb . (tick) Completed           |   |
|  |  [View my responses]                           |   |
|  |                                                |   |
|  +------------------------------------------------+   |
|                                                      |
|  +- Your Progress --------------------------------+   |
|  |                                                |   |
|  |  6 assignments completed                       |   |
|  |  ============----  4 weeks active              |   |
|  |                                                |   |
|  +------------------------------------------------+   |
|                                                      |
|  [Formulate footer]                                  |
+-----------------------------------------------------+
```

**State C: Empty portal (consent given, no assignments yet)**

```
+-----------------------------------------------------+
|  [Formulate logo]              [Manage my data (gear)]|
|                                                      |
|  Your Therapy Workspace                              |
|  --------------------- (amber rule)                  |
|                                                      |
|  No homework assigned yet.                           |
|                                                      |
|  When your therapist assigns a worksheet,            |
|  it will appear here.                                |
|                                                      |
+-----------------------------------------------------+
```

### 1.2 Assignment Cards

Each assignment renders as a card with:

| Field | Source | Display |
|---|---|---|
| Worksheet title | `worksheets.title` via assignment join | Bold, charcoal |
| Assigned date | `assignments.created_at` | "Assigned [date]" |
| Due date | `assignments.due_at` | "Due [date]" — no urgency colouring |
| Status | `assignments.status` | See status badges below |

> **Note:** `assignments.therapist_notes` are NOT shown on client-facing cards. These are therapist-only. A dedicated client-facing message field may be added later.

**Status badges:**

| Status | Badge | Action |
|---|---|---|
| `pending` | ○ Not started | [Open →] links to `/hw/[token]` |
| `in_progress` | ◐ In progress | [Continue →] links to `/hw/[token]` |
| `completed` | ✓ Completed | [View my responses] opens read-only view |
| `withdrawn` | Hidden | Do not show withdrawn assignments |

> **Note:** No distinction between "completed" and "reviewed by therapist." All completed assignments show `✓ Completed`.

**Ordering:**
- Current homework: ordered by due date ascending (most urgent first), then by assigned date
- Completed: ordered by completion date descending (most recent first)

### 1.3 Viewing Completed Responses

When the client taps "View my responses" on a completed assignment, show the worksheet with their responses filled in, read-only. This is the same renderer used for the therapist's review view but:

- No therapist feedback visible (that's for the therapist's eyes only)
- No edit capability
- "Delete this response" link at the bottom (existing deletion flow)
- "Back to workspace" link at the top

Separate page (not modal) — simpler and more reliable, especially on mobile.

**Route:** `/client/[portalToken]/response/[assignmentId]`

### 1.4 Data Management Page

Accessed via "Manage my data" gear link in the portal header.

```
+-----------------------------------------------------+
|  <- Back to workspace                                |
|                                                      |
|  Manage Your Data                                    |
|  --------------------- (amber rule)                  |
|                                                      |
|  Your data belongs to you. You can delete            |
|  individual responses or everything at once.         |
|                                                      |
|  +- Your Responses ------------------------------+   |
|  |                                                |   |
|  |  7-Column Thought Record (8 Feb)      [Delete] |   |
|  |  Graded Exposure Hierarchy (15 Feb)   [Delete] |   |
|  |  Behavioural Activation (22 Feb)      [Delete] |   |
|  |  Panic Diary (in progress)            [Delete] |   |
|  |                                                |   |
|  +------------------------------------------------+   |
|                                                      |
|  +- Delete Everything ----------------------------+   |
|  |                                                |   |
|  |  This will permanently delete all your         |   |
|  |  responses and remove your data from           |   |
|  |  Formulate. This cannot be undone.             |   |
|  |                                                |   |
|  |  [Delete All My Data]                          |   |
|  |                                                |   |
|  +------------------------------------------------+   |
|                                                      |
+-----------------------------------------------------+
```

Both individual and full deletion require a confirmation step: "Are you sure? This cannot be undone." Use a confirmation modal, not a second page.

**Deletion is hard delete** — data is permanently removed from the database, not soft-deleted. The language on the page must accurately reflect this. This is the client exercising their GDPR Art 17 right to erasure.

**Route:** `/client/[portalToken]/data`

This page already substantially exists — it's the current portal. The upgrade is wrapping it in the new visual design and making it accessible from the dashboard rather than being the entire portal experience.

### 1.5 Progress Section

Minimal, encouraging, non-clinical. This is not an outcome measure — it's a motivational nudge.

**Display:**
- Total completed assignments (count only — no "X of Y", no percentage)
- Weeks active (from first assignment to now)
- Optional: a simple visual like a thin amber progress bar

**Do NOT show:**
- Belief ratings or clinical scores (that's the therapist's domain)
- Comparisons to other clients
- Any language that implies a "score" or "grade"
- Anything that could be misinterpreted as clinical feedback
- Any implied denominator (e.g. "3 of 8 completed")

The progress section is omitted if fewer than 2 assignments have been completed. Below that threshold, it's not meaningful and could feel pressuring.

---

## 2. What the Therapist Sees

### 2.1 Portal Link on Client Detail Page (`/clients/[id]`)

Add a "Client Portal" section to the existing client detail page:

```
+- Client Portal --------------------------------+
|                                                  |
|  Portal link: formulatetools.co.uk/client/Ax7... |
|  [Copy link]  [Regenerate link]                  |
|                                                  |
|  Status: (filled) Active (consented 28 Feb 2026) |
|     or:  (empty)  Not yet activated              |
|                                                  |
|  Share this link with your client so they can    |
|  view all their assignments in one place.        |
|                                                  |
+--------------------------------------------------+
```

**"Copy link"** copies the full URL to clipboard with a brief toast confirmation.

**"Regenerate link"** invalidates the old token and creates a new one. Confirmation required: "This will invalidate your client's current portal link. They will need the new link to access their workspace. Continue?" This is the rotation mechanism for compromised links.

**Portal status indicators (two states only):**
- "Not yet activated" — client hasn't consented to the portal yet.
- "Active" — client has consented and accessed the portal. Show consent date.

### 2.2 Assignment Flow Integration

When a therapist assigns homework, the current flow creates a `/hw/[token]` link. No change to this. But add a contextual nudge after the assignment is created:

```
(tick) Homework assigned successfully.

Share with your client:
[homework link]  [Copy]

Tip: Your client can also see all their assignments
at their portal link.  [Copy portal link]
```

This is a suggestion, not a requirement. Many therapists will continue sharing individual homework links. The portal link is for therapists who want to give their client a single bookmarkable URL.

### 2.3 Homework Notification Email (to client)

Deferred. No client email in the system currently (by design — pseudonymous identifiers). The therapist shares the portal link manually, just as they share homework links manually today.

If the encrypted client email feature is built later (see FEATURE-STATE.md §10.6), reminder emails could include a line: "You can also view all your assignments at [portal link]."

---

## 3. Consent & Legal

### 3.1 Portal Consent (Separate from Homework Consent)

The existing consent gate on `/hw/[token]` covers individual homework completion. The portal consent is a separate, broader consent covering persistent access to all responses.

**What the portal consent covers:**
- The client agrees to access their data via this persistent URL
- The client understands the URL is their access credential (private, not to be shared)
- The client can revoke access by deleting all data

**Storage:**

Add consent columns to the existing table:

```sql
ALTER TABLE client_portals ADD COLUMN
  consented_at timestamptz DEFAULT NULL,
  consent_ip_hash text DEFAULT NULL;
```

When `consented_at` is NULL, the portal shows State A (consent screen). When populated, it shows State B or C.

### 3.2 Token Security Reminder

The portal page should include a subtle but persistent reminder:

> "This link is private to you. Don't share it with anyone other than your therapist."

Place this in the footer of the portal page, muted text. Not alarming, just present.

### 3.3 Session Expiry

The portal is stateless — no session, no cookie, no login. The token in the URL is the credential. This means:

- Anyone with the URL can access the portal (same security model as the homework links)
- There's no session timeout to manage
- The "Regenerate link" function on the therapist side is the revocation mechanism

This is intentional and correct. Adding authentication would require collecting client PII (email/password), which contradicts the pseudonymous design.

---

## 4. Data Queries

### 4.1 Portal Dashboard Query

The portal page needs a single query that returns all assignments for the client, with worksheet titles and response status:

```sql
SELECT
  a.id AS assignment_id,
  a.status,
  a.created_at AS assigned_at,
  a.due_at,
  a.completed_at,
  a.homework_token,
  w.title AS worksheet_title,
  w.slug AS worksheet_slug,
  w.category,
  r.id AS response_id,
  r.created_at AS response_created_at
FROM assignments a
JOIN worksheets w ON a.worksheet_id = w.id
LEFT JOIN responses r ON r.assignment_id = a.id
WHERE a.client_id = (
  SELECT client_id FROM client_portals WHERE portal_token = $1
)
AND a.status != 'withdrawn'
AND a.deleted_at IS NULL
ORDER BY
  CASE WHEN a.status IN ('pending', 'in_progress') THEN 0 ELSE 1 END,
  a.due_at ASC NULLS LAST,
  a.completed_at DESC NULLS LAST;
```

> **Note:** `a.therapist_notes` and `a.reviewed_at` are intentionally excluded from this query — not client-facing.

This query is executed via the service client (bypasses RLS) since the client isn't an authenticated user. The portal token is the access credential.

**Performance:** Index `client_portals.portal_token` if not already indexed (it should be, given the nanoid lookup pattern).

### 4.2 Response Viewing Query

When the client views a completed response, fetch the full response data:

```sql
SELECT
  r.response_data,
  r.created_at,
  w.title,
  w.schema
FROM responses r
JOIN assignments a ON r.assignment_id = a.id
JOIN worksheets w ON a.worksheet_id = w.id
WHERE a.id = $1
AND a.client_id = (
  SELECT client_id FROM client_portals WHERE portal_token = $2
)
AND a.deleted_at IS NULL;
```

The double-check (assignment belongs to this portal's client) prevents cross-client data access via URL manipulation.

---

## 5. Mobile Considerations

The portal will be accessed primarily on phones. Design mobile-first.

**Card layout:** Full-width cards, stacked vertically. Touch-friendly — minimum 44px tap targets on all interactive elements.

**Status badges:** Use colour + icon, not just colour. Accessible for colour-blind users.

**Completed responses viewer:** The worksheet renderer already works on mobile (16px font, responsive layout). No additional work needed — reuse the existing renderer in read-only mode.

**Bookmark prompt (primary):** On first visit after consent, show a one-time dismissible banner: "Bookmark this page to find your homework easily." Use a subtle banner at the top, not a modal. This is the primary prompt — most clients will bookmark rather than install a PWA.

---

## 6. Visual Design

Follow the existing Formulate design language:

- **Background:** warm cream (`#fafaf8`)
- **Cards:** white (`#ffffff`) with `1px solid #e8e8e6` border, `6px` border radius
- **Text:** charcoal (`#2d2d2d`) for headings, `#444444` for body, `#999999` for muted
- **Accent:** amber (`#e4a930`) for the rule below the title, status highlights, progress bar
- **Buttons:** primary amber, secondary outlined
- **Font:** DM Sans throughout

The portal should feel like the homework page — warm, calm, uncluttered. It's a client space, not a therapist dashboard. No complex navigation, no sidebar, no tabs. One scrollable page with clear sections.

---

## 7. What NOT to Build

**No messaging.** The portal is not a communication channel. Therapist-client communication happens in session or via their existing channels (email, text, phone). Adding messaging creates a clinical record management problem and a safeguarding liability.

**No scheduling.** The portal doesn't show appointment times or session dates. That's the therapist's practice management system, not Formulate's domain.

**No outcome measures display.** If you add GAD-7/PHQ-9 tracking later (the `measure_administrations` table exists), don't surface scores on the client portal. Clients seeing their own symptom scores without clinical context can cause harm. The therapist discusses scores in session.

**No notifications to clients.** The portal is pull-only. The client visits when they want to. No push notifications, no emails, no nudges from the portal itself. Homework nudges already exist via the cron job and go through the therapist, which is the correct clinical pathway.

**No client-to-client features.** No forums, no peer support, no group features. This is a private therapeutic space.

---

## 8. Progressive Web App (Add to Home Screen)

### 8.1 Goal

Clients can install the portal to their phone's home screen so it opens full-screen like a native app — no address bar, no browser chrome, amber status bar. This is a perception shift: "I have a therapy app" feels different from "I have a link my therapist sent me."

### 8.2 Prerequisites

Three things are needed for PWA install eligibility:

1. **HTTPS** — already in place
2. **Web app manifest** — already exists in the codebase, but needs a dynamic version for per-client `start_url`
3. **Service worker** — minimal, scoped to `/client/`, includes basic offline page

### 8.3 Service Worker

Register a service worker scoped to `/client/`. Serves a basic offline fallback page:

```javascript
// public/portal-sw.js
const OFFLINE_URL = '/client/offline';

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open('portal-offline-v1').then((cache) => cache.add(OFFLINE_URL))
  );
});

self.addEventListener('fetch', (e) => {
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
  }
});
```

Register it on the portal page (after consent, not before):

```javascript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/portal-sw.js', { scope: '/client/' });
}
```

The offline page shows: "You're offline — connect to the internet to view your homework."

### 8.4 Dynamic Manifest

Each client has a unique portal token, so the manifest's `start_url` must be per-client. Serve it from an API route:

**Endpoint:** `GET /api/client-portal/manifest?token=[portalToken]`

**Response:**

```json
{
  "name": "My Therapy Workspace",
  "short_name": "Therapy",
  "start_url": "/client/[portalToken]",
  "display": "standalone",
  "background_color": "#fafaf8",
  "theme_color": "#e4a930",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

Inject in the portal page's `<head>`:

```html
<link rel="manifest" href="/api/client-portal/manifest?token=Ax7Bk9..." />
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="default" />
<meta name="apple-mobile-web-app-title" content="Therapy" />
<link rel="apple-touch-icon" href="/icon-192.png" />
```

The `apple-*` meta tags are needed because iOS Safari doesn't read the manifest for home screen icon and title — it uses these tags instead.

**Validation:** The endpoint should verify the portal token exists before returning the manifest. Return 404 for invalid tokens.

### 8.5 Icons

Create two icon files:

- `/public/icon-192.png` — 192x192px, Formulate logo on warm cream background
- `/public/icon-512.png` — 512x512px, same design

Keep them simple. The icon sits on a client's home screen alongside their other apps. It should be recognisable but not clinical — no stethoscopes, no brain icons, no hearts. The Formulate logo mark or a simple amber-on-cream geometric shape. A client shouldn't feel self-conscious about a therapy app icon being visible on their phone.

### 8.6 Platform-Specific Install Prompts

#### Android (Chrome)

Chrome fires a `beforeinstallprompt` event when PWA criteria are met. Capture it and trigger with a custom button:

```javascript
let deferredPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferredPrompt = e;
  showInstallBanner();
});

function handleInstallClick() {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then((result) => {
      deferredPrompt = null;
      hideInstallBanner();
      if (result.outcome === 'accepted') {
        localStorage.setItem('portal_installed', 'true');
      }
    });
  }
}
```

#### iOS (Safari)

Safari does not support `beforeinstallprompt`. Show an instructional banner instead:

```
+--------------------------------------------------+
|  Add to your home screen                          |
|                                                   |
|  Tap the share button at the bottom of your       |
|  screen, then tap "Add to Home Screen" to         |
|  access your homework like an app.                |
|                                                   |
|                              [Maybe later]        |
+--------------------------------------------------+
```

#### iOS (Non-Safari Browsers)

Only Safari can install PWAs on iOS. If the client opens the portal in Chrome, Firefox, or an in-app browser (e.g. WhatsApp's built-in browser), skip the install prompt entirely. Don't show instructions that won't work.

#### Desktop

Don't show an install prompt. Desktop users can bookmark normally. The PWA install flow is mobile-only.

### 8.7 Detection Logic

```javascript
function getPlatform() {
  const ua = navigator.userAgent;
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !window.MSStream;
  const isSafari = isIOS && /Safari/.test(ua) && !/CriOS|FxiOS|OPiOS/.test(ua);
  const isAndroid = /Android/.test(ua);
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches
    || window.navigator.standalone === true;

  if (isStandalone) return 'already_installed';
  if (isAndroid) return 'android';
  if (isSafari) return 'ios_safari';
  if (isIOS) return 'ios_other';
  return 'desktop';
}
```

| Platform | Action |
|---|---|
| `already_installed` | No prompt — they're already using it as an app |
| `android` | Listen for `beforeinstallprompt`, show button when available |
| `ios_safari` | Show instructional banner |
| `ios_other` | Skip prompt |
| `desktop` | No prompt |

### 8.8 Prompt Timing and Persistence

- Show the **bookmark prompt first** (all platforms), on the first visit after portal consent
- Show the PWA install prompt **second** (mobile only), after the bookmark prompt is dismissed or on the next visit
- If dismissed ("Maybe later"), set `localStorage.setItem('portal_install_dismissed', 'true')` and never show again
- If installed, set `localStorage.setItem('portal_installed', 'true')` and never show again
- Never show prompts before consent (State A) — the client hasn't committed to using the portal yet
- Never show prompts as a modal or blocking overlay — always a dismissible banner

### 8.9 Token Regeneration Caveat

If the therapist regenerates the portal token (revocation mechanism from section 2.1), the installed PWA's `start_url` will point to the old, invalid token. There is no way to update an installed PWA's start URL remotely.

**Impact:** The client taps the home screen icon, the portal opens, and shows a "This link is no longer valid" message.

**Mitigation:** When the therapist clicks "Regenerate link," show a warning: "If your client has added their workspace to their home screen, they will need to remove and re-add it with the new link."

**Error page for invalid tokens:** The portal should handle invalid/expired tokens gracefully:

```
+-----------------------------------------------------+
|  [Formulate logo]                                    |
|                                                      |
|  This link is no longer active.                      |
|                                                      |
|  Your therapist may have updated your workspace      |
|  link. Please ask them for your new link.            |
|                                                      |
|  If you think this is an error, contact your         |
|  therapist directly.                                 |
|                                                      |
+-----------------------------------------------------+
```

No contact details, no support email, no "click here to report." The client's point of contact is their therapist, always.

---

## 9. Implementation Estimate

| Task | Hours | Dependencies |
|---|---|---|
| Portal consent flow (State A) | 2-3 | Schema change: `consented_at` column |
| Portal dashboard page (State B/C) | 3-4 | Dashboard query, card components |
| Response viewer (read-only) | 2-3 | Reuse existing worksheet renderer |
| Data management page upgrade (hard delete) | 1-2 | New hard-delete endpoints, UI wrapper |
| Progress section | 1 | Count query |
| Therapist-side portal link section | 2-3 | Client detail page update, copy/regenerate |
| Token regeneration with confirmation | 1-2 | New API endpoint |
| Assignment flow nudge (copy portal link) | 1 | Post-assignment UI update |
| Mobile styling and testing | 2-3 | Responsive CSS |
| PWA: dynamic manifest endpoint | 1 | API route |
| PWA: service worker + offline page | 1 | Scoped SW + cached offline page |
| PWA: icon files (192 + 512) | 0.5 | Design asset |
| PWA: platform detection + install prompts | 1-2 | Android native prompt + iOS instructional banner |
| PWA: invalid token error page | 0.5 | Graceful handling |
| Bookmark prompt banner | 0.5 | localStorage + dismissible banner |
| **Total** | **20-28** | |

---

## 10. Sequencing

**Do after Session 1 (export fixes).** The portal pages use the same warm colour tokens and DM Sans typography. Get those right globally first, then the portal inherits them.

**Do before or alongside Session 2 (bespoke formulations).** The portal is a standalone feature with no dependency on formulation work. It can run in parallel.

**Launch quietly.** Don't announce it on the landing page. Add the portal link section to the client detail page, let therapists discover it, and gather feedback. If clients find it useful, promote it. If they don't use it, you've lost 20-28 hours, not a product direction.
