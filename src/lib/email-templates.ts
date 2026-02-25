const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'
const LOGO_URL = `${APP_URL}/logo.png`

// Shared email wrapper — branded header with logo, clean body, muted footer
function wrap(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:'DM Sans',Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr><td style="padding:32px 32px 24px;">
          <img src="${LOGO_URL}" alt="Formulate" height="32" style="height:32px;border:0;" />
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-radius:12px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 32px;text-align:center;">
          <p style="margin:0 0 4px;font-size:12px;color:#999;">
            Formulate — Professional CBT tools for clinicians
          </p>
          <p style="margin:0;font-size:12px;color:#999;">
            You received this email because you created an account at
            <a href="${APP_URL}" style="color:#999;">formulatetools.co.uk</a>.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function button(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr><td style="background:#2d2d2d;border-radius:6px;padding:12px 28px;">
      <a href="${href}" style="color:#ffffff;font-size:15px;font-weight:500;text-decoration:none;display:inline-block;">${text}</a>
    </td></tr>
  </table>`
}

function buttonSecondary(text: string, href: string) {
  return `<table cellpadding="0" cellspacing="0" style="margin:8px 0;">
    <tr><td style="border:1.5px solid #ddd;border-radius:6px;padding:10px 24px;">
      <a href="${href}" style="color:#2d2d2d;font-size:14px;font-weight:500;text-decoration:none;display:inline-block;">${text}</a>
    </td></tr>
  </table>`
}

// ─── Welcome Email ─────────────────────────────────────────────

export function welcomeEmail(name: string | null): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  return {
    subject: 'Welcome to Formulate — your toolkit is ready',
    html: wrap(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">Welcome to Formulate</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 16px;font-size:15px;color:#444;line-height:1.6;">
        Your account is set up and your toolkit is ready.
      </p>
      <p style="margin:0 0 8px;font-size:15px;color:#444;line-height:1.6;">
        Your free plan includes:
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#444;line-height:1.8;">
        <li>5 interactive worksheet uses per month</li>
        <li>PDF export on every tool</li>
        <li>1 client for homework links — assign a worksheet, share a link, review their response</li>
      </ul>
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        The quickest way to see what Formulate can do: pick a worksheet, assign it to a client, and share the link.
      </p>
      ${button('Assign Your First Homework →', `${APP_URL}/dashboard`)}
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        Want to explore first? Browse the full library — every tool is free to preview.
      </p>
      ${buttonSecondary('Browse Worksheets →', `${APP_URL}/worksheets`)}
      <p style="margin:16px 0 0;font-size:13px;color:#888;line-height:1.5;">
        Need more than 5 tools a month?
        <a href="${APP_URL}/pricing" style="color:#c48d1e;text-decoration:underline;">Upgrade anytime</a> from £4.99/month.
      </p>
      <p style="margin:24px 0 0;font-size:14px;color:#444;">— The Formulate Team</p>
    `),
  }
}

// ─── Engagement Nudge Email ────────────────────────────────────

export function engagementEmail(name: string | null): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  return {
    subject: 'Your CBT toolkit is ready',
    html: wrap(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">Your toolkit is waiting</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        You signed up for Formulate a few days ago but haven't tried a worksheet yet.
        We've built a library of professional CBT tools that are ready to use — here are a few to get started:
      </p>
      <ul style="margin:0 0 12px;padding-left:20px;font-size:15px;color:#444;line-height:1.8;">
        <li><strong>Thought Record</strong> — the classic CBT tool for examining automatic thoughts</li>
        <li><strong>Behavioural Activation Planner</strong> — schedule meaningful activities step by step</li>
        <li><strong>Formulation Template</strong> — build a shared understanding with your client</li>
      </ul>
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        Each worksheet can be completed on-screen and exported as a clean PDF.
      </p>
      ${button('Try Your First Worksheet', `${APP_URL}/worksheets`)}
      <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
        Your free plan includes 5 worksheet uses per month — no credit card required.
      </p>
    `),
  }
}

// ─── Abandoned Checkout Recovery Email ─────────────────────────

export function abandonedCheckoutEmail(
  name: string | null,
  tierLabel: string
): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  return {
    subject: 'You left something behind',
    html: wrap(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">Your upgrade is waiting</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        You were checking out the <strong>${tierLabel}</strong> plan on Formulate but didn't finish.
        No worries — your toolkit is still ready when you are.
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        Pick up where you left off and unlock unlimited access to professional CBT worksheets:
      </p>
      ${button('Complete Your Upgrade', `${APP_URL}/pricing`)}
      <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
        If you ran into any issues during checkout, just reply to this email and we'll help.
      </p>
    `),
  }
}

// ─── Promo Expiry Warning Email ────────────────────────────────

export function promoExpiryEmail(
  name: string | null,
  tierLabel: string,
  expiryDate: string
): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'
  const formatted = new Date(expiryDate).toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return {
    subject: `Your ${tierLabel} access expires in 3 days`,
    html: wrap(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">Your promo access is ending soon</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        Your <strong>${tierLabel}</strong> promo access expires on <strong>${formatted}</strong>.
        After that, your account will revert to the Free plan (5 worksheet uses per month).
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        To keep unlimited access and all ${tierLabel} features, upgrade before your promo ends:
      </p>
      ${button('Upgrade Your Plan', `${APP_URL}/pricing`)}
      <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
        If you have any questions, just reply to this email.
      </p>
    `),
  }
}

// ─── Client Withdrawal Notification Email ──────────────────────

export function withdrawalNotificationEmail(
  therapistName: string | null,
  clientLabel: string,
  worksheetTitle?: string,
  deletedCount?: number
): { subject: string; html: string } {
  const greeting = therapistName ? `Hi ${therapistName},` : 'Hi there,'

  if (worksheetTitle) {
    // Single response withdrawal
    return {
      subject: `${clientLabel} withdrew their response to ${worksheetTitle}`,
      html: wrap(`
        <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">Client withdrew a response</h2>
        <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
          ${greeting}
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
          <strong>${clientLabel}</strong> has withdrawn their response to <strong>${worksheetTitle}</strong>. The response data has been permanently deleted.
        </p>
        <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
          The assignment record remains in your dashboard but the client's response content is no longer available. This action cannot be undone — it is the client's right under GDPR Article 17.
        </p>
        ${button('View Client Dashboard', `${APP_URL}/clients`)}
        <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
          This is an automated notification. The client exercised their data rights.
        </p>
      `),
    }
  }

  // Full data withdrawal
  return {
    subject: `${clientLabel} has withdrawn consent and deleted all their data`,
    html: wrap(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">Client withdrew all data</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        <strong>${clientLabel}</strong> has withdrawn consent and permanently deleted all their homework data${deletedCount ? ` (${deletedCount} response${deletedCount === 1 ? '' : 's'})` : ''}.
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        All existing homework links for this client have been expired. Future assignments will require the client to re-consent. The client relationship record itself remains intact for your clinical records.
      </p>
      ${button('View Client Dashboard', `${APP_URL}/clients`)}
      <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
        This is an automated notification. The client exercised their data rights under GDPR.
      </p>
    `),
  }
}

// ─── Contributor Role Granted Email ───────────────────────────

const ROLE_DESCRIPTIONS: Record<string, string> = {
  clinical_contributor:
    'Build worksheets using the custom tool builder and submit them to the public library. Your contributions will be attributed to you by name.',
  clinical_reviewer:
    'Review worksheets submitted by other contributors. You\'ll find assigned reviews in your dashboard.',
  content_writer:
    'Write clinical context for existing worksheets to help therapists understand when and how to use them.',
}

const ROLE_DISPLAY_NAMES: Record<string, string> = {
  clinical_contributor: 'Clinical Contributor',
  clinical_reviewer: 'Clinical Reviewer',
  content_writer: 'Content Writer',
}

export function roleGrantedEmail(
  name: string | null,
  roles: string[]
): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  const roleList = roles
    .map((role) => {
      const displayName = ROLE_DISPLAY_NAMES[role] || role
      const description = ROLE_DESCRIPTIONS[role] || ''
      return `<li><strong>${displayName}</strong> — ${description}</li>`
    })
    .join('')

  return {
    subject: "You've been invited to contribute to Formulate",
    html: wrap(`
      <h2 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#2d2d2d;">You're now a Formulate contributor</h2>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        You've been given contributor access on Formulate. Here's what you can do:
      </p>
      <ul style="margin:0 0 16px;padding-left:20px;font-size:15px;color:#444;line-height:1.8;">
        ${roleList}
      </ul>
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        As a contributor, you also have free Practice-tier access for as long as your role is active.
        Head to your dashboard to get started — and set up your contributor profile in Settings so your name appears on published worksheets.
      </p>
      ${button('Open Your Dashboard', `${APP_URL}/dashboard`)}
      <p style="margin:0;font-size:14px;color:#444;">
        Thank you for helping build better tools for therapists.
      </p>
      <p style="margin:16px 0 0;font-size:14px;color:#444;">— The Formulate Team</p>
    `),
  }
}
