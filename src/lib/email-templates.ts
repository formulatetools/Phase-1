const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

// Shared email wrapper — navy header, clean body, muted footer
function wrap(body: string) {
  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f5f5f3;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f3;padding:32px 16px;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
        <!-- Header -->
        <tr><td style="background:#1a1a1a;padding:24px 32px;border-radius:12px 12px 0 0;">
          <span style="color:#e4a930;font-size:20px;font-weight:700;letter-spacing:-0.3px;">formulate</span>
        </td></tr>
        <!-- Body -->
        <tr><td style="background:#ffffff;padding:32px;border-radius:0 0 12px 12px;">
          ${body}
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:20px 32px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#999;">
            You received this email because you have an account at
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
    <tr><td style="background:#1a1a1a;border-radius:8px;padding:12px 28px;">
      <a href="${href}" style="color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;display:inline-block;">${text}</a>
    </td></tr>
  </table>`
}

// ─── Welcome Email ─────────────────────────────────────────────

export function welcomeEmail(name: string | null): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  return {
    subject: 'Welcome to Formulate',
    html: wrap(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">Welcome to Formulate</h1>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        ${greeting}
      </p>
      <p style="margin:0 0 12px;font-size:15px;color:#444;line-height:1.6;">
        Thanks for creating your account. Formulate gives you access to a curated library of
        evidence-based CBT worksheets — ready to use in sessions and export as clean PDFs.
      </p>
      <p style="margin:0 0 4px;font-size:15px;color:#444;line-height:1.6;">
        Your free plan includes <strong>5 worksheet uses per month</strong> to get started.
      </p>
      ${button('Browse Worksheets', `${APP_URL}/worksheets`)}
      <p style="margin:0;font-size:13px;color:#888;line-height:1.5;">
        Need more? You can upgrade anytime from the
        <a href="${APP_URL}/pricing" style="color:#c48d1e;text-decoration:underline;">pricing page</a>.
      </p>
    `),
  }
}

// ─── Engagement Nudge Email ────────────────────────────────────

export function engagementEmail(name: string | null): { subject: string; html: string } {
  const greeting = name ? `Hi ${name},` : 'Hi there,'

  return {
    subject: 'Your CBT toolkit is ready',
    html: wrap(`
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">Your toolkit is waiting</h1>
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
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">Your upgrade is waiting</h1>
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
      <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#1a1a1a;">Your promo access is ending soon</h1>
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
