import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

const FROM_ADDRESS = 'Formulate <hello@formulatetools.co.uk>'

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
  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      subject,
      html,
      ...(emailType ? { tags: [{ name: 'email_type', value: emailType }] } : {}),
    })
    if (error) {
      console.error('[email] Resend error:', error)
    }
  } catch (err) {
    console.error('[email] Failed to send:', err)
  }
}
