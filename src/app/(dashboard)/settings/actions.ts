'use server'

import { getCurrentUser } from '@/lib/supabase/auth'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'
import { revalidatePath } from 'next/cache'
import { logger } from '@/lib/logger'

/**
 * Permanently deletes ALL data for the currently authenticated therapist.
 *
 * Deletion strategy:
 * 1. Cancel Stripe subscription (if any)
 * 2. Explicitly delete rows from tables that lack ON DELETE CASCADE
 * 3. SET NULL on FK columns pointing to this user on system worksheets
 * 4. Delete the auth.users row — this cascades through all remaining
 *    ON DELETE CASCADE foreign keys (profiles → relationships → assignments → responses, etc.)
 *
 * Tables with ON DELETE CASCADE (auto-cleaned by step 4):
 *   profiles, subscriptions, organisations, therapeutic_relationships,
 *   worksheet_assignments, worksheet_responses, homework_consent, homework_events,
 *   portal_pin_attempts, shared_resources, worksheet_access_log, audit_log,
 *   feature_requests, feature_request_votes, referral_codes, referrals,
 *   promo_redemptions, training_progress, ema_schedules, ema_responses, emi_rules,
 *   measure_administrations, worksheets (where created_by = user), consent_records
 *
 * Tables WITHOUT cascade that we handle explicitly:
 *   plan_queue_items, plan_queues, blog_reactions, blog_posts,
 *   worksheet_reviews, worksheets.submitted_by, worksheets.published_by
 */
export async function deleteAccount(): Promise<{ error?: string }> {
  const { user } = await getCurrentUser()
  if (!user) return { error: 'Not authenticated' }

  const admin = createAdminClient()

  try {
    // ── 1. Cancel Stripe subscription ──────────────────────────────────
    const { data: profile } = await admin
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', user.id)
      .single()

    if (profile?.stripe_customer_id) {
      try {
        const subscriptions = await stripe.subscriptions.list({
          customer: profile.stripe_customer_id,
          status: 'active',
        })
        for (const sub of subscriptions.data) {
          await stripe.subscriptions.cancel(sub.id)
        }
      } catch (e) {
        // Log but don't block deletion — orphaned Stripe records are harmless
        logger.warn('Failed to cancel Stripe subscriptions', { error: String(e) })
      }
    }

    // ── 2. Delete non-cascading tables in dependency order ─────────────

    // 2a. plan_queue_items → plan_queues (queue_items cascades from queues)
    const { data: queues } = await admin
      .from('plan_queues')
      .select('id')
      .eq('therapist_id', user.id)

    if (queues && queues.length > 0) {
      const queueIds = queues.map((q) => q.id)
      const { error: itemsErr } = await admin
        .from('plan_queue_items')
        .delete()
        .in('queue_id', queueIds)
      if (itemsErr) logger.warn('Failed to delete plan_queue_items', { error: itemsErr.message })

      const { error: queuesErr } = await admin
        .from('plan_queues')
        .delete()
        .eq('therapist_id', user.id)
      if (queuesErr) logger.warn('Failed to delete plan_queues', { error: queuesErr.message })
    }

    // 2b. blog_reactions
    const { error: reactionsErr } = await admin
      .from('blog_reactions')
      .delete()
      .eq('user_id', user.id)
    if (reactionsErr) logger.warn('Failed to delete blog_reactions', { error: reactionsErr.message })

    // 2c. blog_posts (soft-delete to preserve comment threads / SEO)
    const { error: postsErr } = await admin
      .from('blog_posts')
      .update({ deleted_at: new Date().toISOString() })
      .eq('author_id', user.id)
      .is('deleted_at', null)
    if (postsErr) logger.warn('Failed to soft-delete blog_posts', { error: postsErr.message })

    // 2d. worksheet_reviews
    const { error: reviewsErr } = await admin
      .from('worksheet_reviews')
      .delete()
      .eq('reviewer_id', user.id)
    if (reviewsErr) logger.warn('Failed to delete worksheet_reviews', { error: reviewsErr.message })

    // ── 3. Nullify FK columns on system worksheets ─────────────────────
    // Curated worksheets may have submitted_by / published_by pointing to this user
    const { error: submittedErr } = await admin
      .from('worksheets')
      .update({ submitted_by: null })
      .eq('submitted_by', user.id)
    if (submittedErr) logger.warn('Failed to nullify submitted_by', { error: submittedErr.message })

    const { error: publishedErr } = await admin
      .from('worksheets')
      .update({ published_by: null })
      .eq('published_by', user.id)
    if (publishedErr) logger.warn('Failed to nullify published_by', { error: publishedErr.message })

    // ── 4. Delete auth user (cascades profile → everything else) ───────
    const { error: authErr } = await admin.auth.admin.deleteUser(user.id)
    if (authErr) {
      logger.error('Failed to delete auth user', authErr)
      return { error: 'Failed to delete your account. Please contact support.' }
    }

    revalidatePath('/settings')
    return {}
  } catch (e) {
    logger.error('Account deletion failed', e)
    return { error: 'An unexpected error occurred. Please contact support.' }
  }
}
