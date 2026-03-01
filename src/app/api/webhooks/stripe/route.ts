import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { STRIPE_PRICES, TIER_LABELS } from '@/lib/stripe/config'
import { sendEmail } from '@/lib/email'
import { abandonedCheckoutEmail, subscriptionCancelledEmail, paymentFailedEmail } from '@/lib/email-templates'

// Determine subscription tier from the Stripe price ID
function getTierFromPriceId(priceId: string): 'starter' | 'standard' | 'professional' | null {
  const { starter, standard, professional } = STRIPE_PRICES
  if (priceId === starter.monthly || priceId === starter.annual) return 'starter'
  if (priceId === standard.monthly || priceId === standard.annual) return 'standard'
  if (priceId === professional.monthly || priceId === professional.annual) return 'professional'
  return null
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 })
  }

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  const supabase = createAdminClient()

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const subscriptionId = session.subscription as string

        if (!userId || !subscriptionId) break

        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        const priceId = subscription.items.data[0]?.price.id
        const tier = getTierFromPriceId(priceId || '')

        if (!tier) break

        // Create subscription record
        // Stripe v20+: period dates come from the latest invoice
        const latestInvoice = subscription.latest_invoice
        const invoiceObj = typeof latestInvoice === 'string'
          ? await stripe.invoices.retrieve(latestInvoice)
          : latestInvoice
        const periodStart = invoiceObj?.period_start
          ? new Date(invoiceObj.period_start * 1000).toISOString()
          : new Date(subscription.start_date * 1000).toISOString()
        const periodEnd = invoiceObj?.period_end
          ? new Date(invoiceObj.period_end * 1000).toISOString()
          : new Date((subscription.start_date + 30 * 86400) * 1000).toISOString()

        await supabase.from('subscriptions').insert({
          user_id: userId,
          stripe_subscription_id: subscriptionId,
          stripe_price_id: priceId,
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
          cancel_at_period_end: subscription.cancel_at_period_end,
        })

        // Update profile
        await supabase
          .from('profiles')
          .update({
            subscription_tier: tier,
            subscription_status: 'active',
            stripe_customer_id: session.customer as string,
          })
          .eq('id', userId)

        // Audit log
        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'create',
          entity_type: 'subscription',
          entity_id: subscriptionId,
          metadata: { tier, price_id: priceId },
        })

        // Convert pending referral if this user was referred
        try {
          const { data: pendingReferral } = await supabase
            .from('referrals')
            .select('id, referrer_id')
            .eq('referee_id', userId)
            .eq('status', 'pending')
            .single()

          if (pendingReferral) {
            await supabase
              .from('referrals')
              .update({ status: 'converted' })
              .eq('id', pendingReferral.id)

            await supabase.from('audit_log').insert({
              user_id: pendingReferral.referrer_id,
              action: 'update',
              entity_type: 'referral',
              entity_id: pendingReferral.id,
              metadata: { referee_id: userId, status: 'converted' },
            })
          }
        } catch {
          // Don't fail the webhook if referral tracking fails
          console.error('[referral] Failed to convert referral for user:', userId)
        }

        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        const priceId = subscription.items.data[0]?.price.id
        const tier = getTierFromPriceId(priceId || '')

        // Map Stripe status to our status
        let status: 'active' | 'cancelled' | 'past_due' = 'active'
        if (subscription.status === 'past_due') status = 'past_due'
        if (subscription.status === 'canceled') status = 'cancelled'

        // Get period dates from the latest invoice (Stripe v20+)
        const latestInvoice = subscription.latest_invoice
        const invoiceObj = typeof latestInvoice === 'string'
          ? await stripe.invoices.retrieve(latestInvoice)
          : latestInvoice
        const periodStart = invoiceObj?.period_start
          ? new Date(invoiceObj.period_start * 1000).toISOString()
          : new Date(subscription.start_date * 1000).toISOString()
        const periodEnd = invoiceObj?.period_end
          ? new Date(invoiceObj.period_end * 1000).toISOString()
          : new Date((subscription.start_date + 30 * 86400) * 1000).toISOString()

        // Upsert subscription record (handles both create and update)
        await supabase
          .from('subscriptions')
          .upsert({
            user_id: profile.id,
            stripe_subscription_id: subscription.id,
            stripe_price_id: priceId,
            status: status === 'cancelled' ? 'cancelled' : status,
            current_period_start: periodStart,
            current_period_end: periodEnd,
            cancel_at_period_end: subscription.cancel_at_period_end,
          }, { onConflict: 'stripe_subscription_id' })

        // Update profile tier
        if (tier) {
          await supabase
            .from('profiles')
            .update({
              subscription_tier: tier,
              subscription_status: status,
            })
            .eq('id', profile.id)
        }

        // Audit log
        await supabase.from('audit_log').insert({
          user_id: profile.id,
          action: event.type === 'customer.subscription.created' ? 'create' : 'update',
          entity_type: 'subscription',
          entity_id: subscription.id,
          metadata: { tier, status, price_id: priceId },
        })

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        // Capture the tier label before reverting
        const cancelledPriceId = subscription.items.data[0]?.price.id
        const cancelledTier = getTierFromPriceId(cancelledPriceId || '')
        const cancelledTierLabel = cancelledTier ? TIER_LABELS[cancelledTier] : 'Premium'

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({ status: 'cancelled' })
          .eq('stripe_subscription_id', subscription.id)

        // Revert profile to free tier
        await supabase
          .from('profiles')
          .update({
            subscription_tier: 'free',
            subscription_status: 'cancelled',
            monthly_download_count: 0,
          })
          .eq('id', profile.id)

        // Audit log
        await supabase.from('audit_log').insert({
          user_id: profile.id,
          action: 'delete',
          entity_type: 'subscription',
          entity_id: subscription.id,
          metadata: { reverted_to: 'free' },
        })

        // Send cancellation email
        if (profile.email) {
          const cancelEmail = subscriptionCancelledEmail(profile.full_name, cancelledTierLabel)
          sendEmail({
            to: profile.email,
            subject: cancelEmail.subject,
            html: cancelEmail.html,
            emailType: 'subscription_cancelled',
          }).catch((e) => console.error('Failed to send cancellation email:', e))
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, full_name, subscription_tier')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

        // Set status to past_due but maintain access until period end
        await supabase
          .from('profiles')
          .update({ subscription_status: 'past_due' })
          .eq('id', profile.id)

        // Stripe v20+: subscription is in invoice.parent.subscription_details
        const subId = invoice.parent?.subscription_details?.subscription
        const subIdStr = typeof subId === 'string' ? subId : subId?.id
        if (subIdStr) {
          await supabase
            .from('subscriptions')
            .update({ status: 'past_due' })
            .eq('stripe_subscription_id', subIdStr)
        }

        // Send payment failed email
        if (profile.email) {
          const failedTierLabel = TIER_LABELS[profile.subscription_tier] || 'Premium'
          const failedEmail = paymentFailedEmail(profile.full_name, failedTierLabel)
          sendEmail({
            to: profile.email,
            subject: failedEmail.subject,
            html: failedEmail.html,
            emailType: 'payment_failed',
          }).catch((e) => console.error('Failed to send payment failed email:', e))
        }

        break
      }

      case 'checkout.session.expired': {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.supabase_user_id
        const tier = session.metadata?.tier

        if (!userId || !tier) break

        // Look up user profile
        const { data: expiredProfile } = await supabase
          .from('profiles')
          .select('email, full_name')
          .eq('id', userId)
          .single()

        if (!expiredProfile?.email) break

        // Dedup: max 1 abandoned checkout email per user per 7 days
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        const { count: recentSends } = await supabase
          .from('audit_log')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .eq('entity_type', 'email')
          .eq('entity_id', 'abandoned_checkout')
          .gte('created_at', sevenDaysAgo)

        if ((recentSends ?? 0) > 0) break

        // Send recovery email (fire-and-forget)
        const tierLabel = TIER_LABELS[tier] || 'Starter'
        const email = abandonedCheckoutEmail(expiredProfile.full_name, tierLabel)
        sendEmail({ to: expiredProfile.email, subject: email.subject, html: email.html, emailType: 'abandoned_checkout' })

        // Log for dedup
        await supabase.from('audit_log').insert({
          user_id: userId,
          action: 'create',
          entity_type: 'email',
          entity_id: 'abandoned_checkout',
          metadata: { tier, tier_label: tierLabel },
        })

        break
      }
    }
  } catch (error) {
    // Log but return 200 to prevent Stripe from retrying non-transient errors
    // (e.g. profile not found, DB constraint violations). Stripe will retry
    // indefinitely on 5xx responses, creating noise and wasted compute.
    console.error('Webhook handler error:', error)
  }

  return NextResponse.json({ received: true })
}
