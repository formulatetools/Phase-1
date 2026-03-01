import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = 'Formulate <hello@formulatetools.co.uk>'
const REPLY_TO = 'hello@formulatetools.co.uk'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://formulatetools.co.uk'

// Marketing/promotional email types that need List-Unsubscribe headers
const MARKETING_EMAIL_TYPES = new Set([
  'engagement',
  'abandoned_checkout',
  'free_reset',
  'blog_digest',
])

/** Strip HTML tags and decode common entities to produce a plain-text fallback. */
function htmlToPlainText(html: string): string {
  return html
    // Remove preheader hidden div
    .replace(/<div[^>]*display:\s*none[^>]*>[\s\S]*?<\/div>/gi, '')
    // Convert <br> and block-level closings to newlines
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|h[1-6]|li|tr|div)>/gi, '\n')
    // Convert <li> to bullet
    .replace(/<li[^>]*>/gi, '  - ')
    // Convert links to "text (url)" format
    .replace(/<a[^>]+href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, '$2 ($1)')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode common HTML entities
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&rsquo;/g, '\u2019')
    .replace(/&lsquo;/g, '\u2018')
    .replace(/&ldquo;/g, '\u201C')
    .replace(/&rdquo;/g, '\u201D')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&pound;/g, '£')
    .replace(/&rarr;/g, '->')
    .replace(/&zwnj;/g, '')
    .replace(/&nbsp;/g, ' ')
    // Collapse whitespace
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export async function sendEmail({
  to,
  subject,
  html,
  emailType,
}: {
  to: string
  subject: string
  html: string
  emailType?: string
}) {
  const isMarketing = emailType && MARKETING_EMAIL_TYPES.has(emailType)

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to,
      subject,
      html,
      text: htmlToPlainText(html),
      ...(emailType ? { tags: [{ name: 'email_type', value: emailType }] } : {}),
      headers: isMarketing
        ? {
            'List-Unsubscribe': `<${APP_URL}/settings>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          }
        : undefined,
    })
    if (error) {
      console.error('[email] Resend error:', error)
    }
  } catch (err) {
    console.error('[email] Failed to send:', err)
  }
}
