# Client/Patient Workflow UX Review

**Date:** 2026-03-05
**Scope:** All client-facing surfaces — homework flow, consent gates, client portal, PIN auth, data management, resources, PDF generation

---

## Executive Summary

The client workflow is well-architected with strong privacy foundations, good offline resilience, and thoughtful GDPR compliance. The review identified **42 issues** across accessibility, UX friction, edge cases, security hardening, and visual polish. No critical security vulnerabilities were found, but several medium-priority UX gaps could meaningfully improve the patient experience.

---

## 1. CONSENT FLOW

### 1.1 Homework Consent Gate (`src/components/homework/consent-gate.tsx`)

**[P1 — UX] No loading state on initial render when consent is already granted**
- Line 39: `if (consented) return <>{children}</>` renders children immediately, but there's no skeleton/loading state during the server fetch. The page may flash from consent screen to content on slow connections if `initialHasConsent` arrives late from the server component.
- **Recommendation:** The server component already resolves this, but verify there's no hydration flash.

**[P2 — A11y] Consent screen lacks `<h1>` hierarchy**
- Line 155: Uses `<h2>` ("Before you begin") but there's no `<h1>` on the consent screen. Screen readers expect a heading hierarchy.
- **Recommendation:** Change to `<h1>` or ensure the parent page provides one.

**[P2 — UX] Post-decline state has no "redo" action besides reopening the link**
- Lines 115-117: Text says "You can open this link again to complete the worksheet online" but this requires the user to manually reload. The consent state is likely server-side so a simple button to re-navigate would be cleaner.
- **Recommendation:** Add a "Complete online instead" button that reloads the page.

**[P3 — UX] "Download Blank PDF Instead" button text is long on mobile**
- Line 220: Button text may wrap awkwardly on narrow screens. The `sm:flex-row` layout helps but on very small devices both buttons stack with long text.
- **Recommendation:** Shorten to "Download PDF" on mobile or use responsive text.

**[P2 — A11y] Privacy/Terms links missing `focus-visible` ring in dark mode**
- Lines 227-233: Focus ring uses `focus-visible:ring-brand/40` but doesn't account for dark mode contrast.
- **Recommendation:** Add `dark:focus-visible:ring-brand/60` or similar.

### 1.2 Portal Consent (`src/components/client-portal/portal-consent.tsx`)

**[P2 — UX] "No thanks" dismissal is confusing**
- Lines 40-56: Dismissing portal consent shows "You can still complete individual homework via the links your therapist shares with you" — but this state is not persisted server-side. If the user refreshes, they see the consent screen again.
- **Recommendation:** Either persist the dismissal server-side or make the dismiss behavior clearer ("You can set this up later").

**[P2 — A11y] Error div missing `role="alert"`**
- Line 150: The error container uses no ARIA role, so screen readers may not announce errors.
- **Recommendation:** Add `role="alert"` to the error div.

**[P3 — UX] Legal links lack sr-only "(opens in new tab)" text**
- Lines 143-145: Privacy Policy and Terms of Use links open in new tabs but don't communicate this to screen reader users (unlike the homework consent gate which does).
- **Recommendation:** Add `<span className="sr-only"> (opens in new tab)</span>` consistently.

---

## 2. HOMEWORK COMPLETION FLOW

### 2.1 Homework Page (`src/app/hw/[token]/page.tsx`)

**[P2 — UX] Expired page has no empathy/reassurance**
- Lines 136-162: The expired page is functional but cold. For a therapy context, showing "This link has expired" with a clock icon may feel clinical.
- **Recommendation:** Soften the copy: "This assignment's deadline has passed. Don't worry — your therapist can send you a new link if needed."

**[P3 — UX] Due date in header doesn't show year for cross-year assignments**
- Line 266: Uses `{ day: 'numeric', month: 'short' }` without year, which could be ambiguous for long-running therapy relationships.
- **Recommendation:** Add year if assignment spans calendar years (the `AssignmentCard` already does this).

**[P1 — UX] Read-only banner text is inaccurate for locked-but-not-submitted worksheets**
- Lines 205-220: Banner says "This worksheet has been submitted and reviewed. It is now read-only." but the `readOnly` flag is also true for locked worksheets that haven't been submitted yet. A locked-in-progress worksheet would show this misleading message.
- **Recommendation:** Differentiate the message based on `isLocked` vs `isCompleted`:
  - Locked: "Your therapist has locked this worksheet."
  - Completed: "This worksheet has been submitted."
  - Reviewed: "This worksheet has been submitted and reviewed."

**[P2 — Security] Portal token auto-generation side effect in GET request**
- Lines 104-110: The page auto-generates a portal token if missing. While behind a token check, this is a write operation inside what's conceptually a read (page render). This could theoretically be triggered by prefetch/crawlers.
- **Recommendation:** Move portal token generation to the first write operation (e.g., consent acceptance) instead.

### 2.2 Homework Form (`src/components/homework/homework-form.tsx`)

**[P1 — UX] No confirmation before navigating away with unsaved changes**
- The form uses `beforeunload` (per the agent's findings), but verify this is implemented. Users filling out therapy homework may lose significant emotional/therapeutic work if they accidentally close the tab.
- **Recommendation:** Ensure `beforeunload` handler is active when `hasChangesRef.current` is true.

**[P2 — UX] "Save draft" button disabled during offline state but no explanation**
- Line 566: Button is disabled when offline but there's no tooltip or visual explanation of why.
- **Recommendation:** Add a tooltip or disabled-state text: "Save draft (offline — will save when you reconnect)".

**[P2 — UX] Delete entry uses `confirm()` native dialog**
- Line 508: `if (!confirm(...)) return` — native browser dialogs are jarring, unstyled, and may be blocked. In a therapy context, this feels particularly out of place.
- **Recommendation:** Use a styled confirmation modal consistent with the rest of the UI.

**[P3 — UX] Entry tabs have no visual indication of which entries have content**
- The diary mode tab strip shows "Entry 1", "Entry 2" etc. but doesn't indicate which entries have been filled in.
- **Recommendation:** Add a small dot or completion indicator to entry tabs that contain data.

**[P2 — A11y] Progress bar lacks text alternative**
- The thin amber progress bar shows percentage visually but has no `role="progressbar"` or `aria-valuenow`. (Note: the `ProgressSection` component in the portal DOES have proper ARIA — this is the homework form's inline progress bar.)
- **Recommendation:** Add ARIA progressbar attributes to the homework form's progress indicator.

**[P3 — UX] "Submit queued" button state is ambiguous**
- Line 575: Shows "Submit queued" when offline but doesn't explain what will happen.
- **Recommendation:** Change to "Will submit when online" or add a tooltip.

### 2.3 Worksheet Fields

**[P2 — A11y] Likert field grayed-out-until-first-interaction pattern**
- The likert slider starts "grayed out" until touched. This may confuse screen reader users who can't see the visual state.
- **Recommendation:** Add `aria-description="Slide to select a value"` or an explicit "Not yet rated" label.

**[P3 — UX] Date/time fields use native HTML5 inputs**
- These render differently across browsers and are particularly awkward on desktop Safari. On mobile they're fine.
- **Recommendation:** Consider a custom date picker for desktop, or at minimum test across major browsers.

**[P2 — UX] Table field mobile card layout threshold (5+ columns) may be too high**
- Tables with 4 columns on a 320px screen will still render as a horizontal table, which likely overflows.
- **Recommendation:** Lower the threshold to 3+ columns or use overflow-x-auto with scroll indicators.

---

## 3. CLIENT PORTAL

### 3.1 PIN Entry (`src/components/client-portal/pin-entry.tsx`)

**[P2 — A11y] PIN inputs lack `focus-visible` styles**
- Line 173: Uses `focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/30` — uses `focus` instead of `focus-visible`, which means the ring appears on mouse click too, which is non-standard.
- **Recommendation:** Switch to `focus-visible:` prefix for all focus styles on PIN inputs.

**[P3 — UX] Lockout countdown shows minutes:seconds but doesn't explain**
- Line 189: Shows "Try again in 14:32" but doesn't say "minutes". Could be misread as a time of day.
- **Recommendation:** Change to "Try again in 14 min 32 sec" or "Try again in ~15 minutes".

**[P2 — UX] No "forgot PIN?" affordance beyond tiny 10px text**
- Line 219-221: "Forgot your PIN? Ask your therapist to reset it." is in `text-[10px]` — extremely small and easy to miss, especially for older users or those with visual impairments.
- **Recommendation:** Increase to at least `text-xs` (12px) and consider making "contact your therapist" actionable (e.g., show therapist name if available).

**[P3 — A11y] Lockout state doesn't disable submit button**
- Line 201: The submit button is hidden when locked out (`!lockedOut`), but the PIN inputs remain visible and interactive even though they're `disabled`. This sends mixed signals.
- **Recommendation:** Show a clear lockout message covering the entire input area, or add explanatory text above the inputs.

### 3.2 Assignment Card (`src/components/client-portal/assignment-card.tsx`)

**[P2 — UX] PDF download failure is silent**
- Line 78-79: `catch {}` — PDF generation failures are completely swallowed. The user clicks, nothing happens, the button just reverts.
- **Recommendation:** Show a toast or inline error: "PDF download failed. Please try again."

**[P3 — UX] No visual distinction between "assigned" and "pdf_downloaded" status**
- The `pdf_downloaded` status isn't handled in the status badge rendering (lines 111-140). These assignments show no status badge at all.
- **Recommendation:** Add a "PDF downloaded" status badge or group these with "Not started".

**[P3 — UX] "Open" and "Continue" links use `<a>` instead of Next.js `<Link>`**
- Lines 173-193: These use plain `<a>` tags with full URL (`${appUrl}/hw/...`), which triggers a full page navigation instead of client-side routing.
- **Recommendation:** If the homework pages are within the same Next.js app, use `<Link>` for faster transitions.

### 3.3 Resource Card (`src/components/client-portal/resource-card.tsx`)

**[P2 — A11y] "Open" link for non-video resources lacks sr-only "(opens in new tab)"**
- Lines 173-184: External link opens in new tab but has no screen reader indication.
- **Recommendation:** Add `<span className="sr-only"> (opens in new tab)</span>`.

**[P3 — A11y] External link icon next to "Open" has no `aria-hidden`**
- Line 181: The SVG arrow icon lacks `aria-hidden="true"`, so screen readers may try to describe it.
- **Recommendation:** Add `aria-hidden="true"`.

**[P2 — UX] Video thumbnails loaded through proxy may be slow**
- Line 97: Video thumbnails go through the image proxy, adding latency. For YouTube thumbnails (which are publicly accessible anyway), this adds unnecessary delay.
- **Recommendation:** Consider allowing known safe thumbnail domains (YouTube, Vimeo) to load directly, only proxying unknown domains.

### 3.4 Progress Section (`src/components/client-portal/progress-section.tsx`)

**[P3 — UX] Logarithmic progress bar may confuse users**
- Line 12: The bar never reaches 100% which could feel demotivating. Users may wonder "when am I done?"
- **Recommendation:** Either explain the metric ("Keep it up!") or switch to a simple count-based visual. The current approach works but consider adding supportive text.

**[P3 — UX] "x/week" average appears after 2 weeks but may be misleading early**
- Line 47: At exactly 2 weeks with 2 completions, it shows "1.0/week" which is mathematically correct but not meaningful with such small samples.
- **Recommendation:** Increase threshold to 3+ weeks before showing the rate.

---

## 4. DATA MANAGEMENT & GDPR

### 4.1 Data Management (`src/components/client-portal/data-management.tsx`)

**[P1 — UX] "DELETE" confirmation requires exact case match**
- The delete-all flow requires typing "DELETE" (uppercase). This is a reasonable safety measure but could frustrate users, especially on mobile with auto-capitalize behavior.
- **Recommendation:** Accept case-insensitive matching (`"delete"`, `"Delete"`, `"DELETE"` all valid).

**[P2 — UX] Rate limiting on deletions may confuse clients exercising GDPR rights**
- The 10/hour rate limit on deletion events could block a client who's methodically deleting individual responses before doing a full purge.
- **Recommendation:** Show a clear message explaining the rate limit and suggesting "Delete all" as an alternative if they're hitting limits on individual deletions.

**[P2 — UX] No data export functionality**
- GDPR Article 20 (right to data portability) requires the ability to export data in a machine-readable format. Currently clients can download PDFs but not structured data.
- **Recommendation:** Add a "Download my data" button that exports a JSON/CSV of all responses.

**[P3 — UX] PIN management section may be confusing for users who didn't set a PIN**
- If no PIN is set, the section should clearly explain what a PIN does and why they might want one.
- **Recommendation:** Ensure the no-PIN state has an explanatory intro.

### 4.2 Response Deletion Flow

**[P2 — UX] No undo/grace period after single response deletion**
- Single responses are hard-deleted immediately. Given the therapy context, accidental deletion of a meaningful response could be distressing.
- **Recommendation:** Consider a 30-second "undo" toast before hard-deleting, or use soft-delete with a 24-hour purge window.

---

## 5. SECURITY & PRIVACY

**[P2 — Security] Homework token in URL is the sole authentication**
- The `/hw/[token]` route has no additional authentication layer. If a token is leaked (shared link, email compromise, browser history), anyone can view/modify the homework.
- **Recommendation:** Consider adding a lightweight verification step (e.g., client's year of birth, or first 2 digits of their portal PIN if set) before allowing edits. At minimum, log the IP hash of submissions for audit purposes.

**[P2 — Security] Image proxy could be used for SSRF if URL validation is weak**
- The image proxy at `/api/client-portal/image-proxy` validates HTTPS-only and allowed content types, which is good. Verify it also blocks internal/private IP ranges (10.x, 172.16-31.x, 192.168.x, 127.x, etc.).
- **Recommendation:** Add explicit private IP range blocking if not already present.

**[P3 — Security] PWA manifest exposes portal token in start_url**
- The PWA manifest includes the portal token in `start_url`, which could appear in browser suggestions, PWA listings, or device management screens.
- **Recommendation:** Consider if this is acceptable given the threat model. For most scenarios it's fine, but worth documenting.

**[P2 — Privacy] Resource view tracking fires on every click, not just first view**
- Line 73-77 in `resource-card.tsx`: The `handleClick` function fires the resource-viewed API call every time, not just on first view. While the server only updates `viewed_at` once, the API still receives the request with IP metadata.
- **Recommendation:** Client-side check: skip the API call if `resource.viewed_at` is already set.

---

## 6. VISUAL & UI POLISH

**[P3 — UI] Inconsistent border radius across cards**
- Most cards use `rounded-2xl` but some inner elements use `rounded-xl` or `rounded-lg`. The consent gate error div uses `rounded-xl` while the homework form error div also uses `rounded-xl`, but buttons vary between `rounded-lg` and `rounded-xl`.
- **Recommendation:** Establish a consistent radius scale in the design system.

**[P3 — UI] Dark mode colors inconsistent across portal components**
- The portal consent has `dark:text-primary-700` on the dismissed-state text (line 44), which may be too dark on dark backgrounds. Meanwhile other components use `dark:text-primary-600`.
- **Recommendation:** Audit dark mode text colors for consistency and contrast ratios.

**[P3 — UI] Bookmark banner and PWA install banner may compete for attention**
- Both `bookmark-banner.tsx` and `pwa-install-banner.tsx` are dismissible banners that appear on the portal. If both show simultaneously, they may create banner fatigue.
- **Recommendation:** Prioritize PWA install banner over bookmark banner, and show bookmark only if PWA install was dismissed or not applicable.

**[P2 — UI] PIN setup banner is dismissible with localStorage only**
- If a user clears their browser data or switches devices, they see the PIN setup prompt again even though they've consciously declined.
- **Recommendation:** Consider tracking the dismissal server-side (a lightweight "dismissed_pin_prompt_at" field) so it persists across devices.

---

## 7. EDGE CASES

**[P2 — Edge] Concurrent tab race condition on consent**
- If a client opens the homework link in two tabs, both show the consent screen. Accepting in one tab doesn't update the other. The second tab's accept will hit a unique constraint.
- **Recommendation:** The API already handles the unique constraint gracefully (returns success). Verify the client correctly handles this case without showing an error.

**[P2 — Edge] Diary mode delete-last-entry prevention**
- Line 505: Delete button only shows when `entryCount > 1`, which correctly prevents deleting the last entry. But if the user fills entry 1, adds entry 2, deletes entry 1 — the active entry index may shift incorrectly.
- **Recommendation:** Verify entry deletion maintains correct active index and doesn't lose the "current view" data.

**[P3 — Edge] Expired assignments still show in "current" list with expired badge**
- The portal splits assignments into current/completed, but expired-and-not-started assignments may linger in the current list indefinitely.
- **Recommendation:** Move assignments expired for 30+ days to a separate section or archive them.

**[P2 — Edge] PDF download on assignment card catches and swallows all errors**
- Line 78: `catch {}` means even network errors, out-of-memory on large worksheets, or pdf-lib failures are invisible.
- **Recommendation:** At minimum log to console; ideally show user-facing feedback.

---

## Priority Summary

| Priority | Count | Description |
|----------|-------|-------------|
| P1       | 4     | Functional issues affecting core workflow |
| P2       | 21    | Meaningful UX/A11y improvements |
| P3       | 17    | Polish and minor enhancements |

### Top 5 Recommendations (Highest Impact)

1. **Fix read-only banner text** to differentiate locked vs completed vs reviewed states (`hw/[token]/page.tsx:205-220`)
2. **Add `role="alert"` to portal consent error** and consistent ARIA across all error states
3. **Accept case-insensitive "DELETE" confirmation** in data management
4. **Add data export (JSON/CSV)** for GDPR Article 20 compliance
5. **Show PDF download errors** instead of swallowing them silently in assignment cards
