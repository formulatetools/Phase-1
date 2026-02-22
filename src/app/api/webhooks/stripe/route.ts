import { NextResponse, type NextRequest } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe/client'
import { createAdminClient } from '@/lib/supabase/admin'
import { STRIPE_PRICES } from '@/lib/stripe/config'

// Determine subscription tier from the Stripe price ID
function getTierFromPriceId(priceId: string): 'standard' | 'professional' | null {
  const { standard, professional } = STRIPE_PRICES
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

        break
      }

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

        // Update subscription record
        await supabase
          .from('subscriptions')
          .update({
            stripe_price_id: priceId,
            status: status === 'cancelled' ? 'cancelled' : status,
            cancel_at_period_end: subscription.cancel_at_period_end,
          })
          .eq('stripe_subscription_id', subscription.id)

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
          action: 'update',
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
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (!profile) break

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

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string

        const { data: profile } = await supabase
          .from('profiles')
          .select('id')
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

        break
      }
    }
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}
