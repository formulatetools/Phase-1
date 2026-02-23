import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { stripe } from '@/lib/stripe/client'

interface ServiceStatus {
  status: 'ok' | 'error'
  latencyMs: number
  error?: string
}

export async function GET() {
  const checks: Record<string, ServiceStatus> = {}

  // ── Supabase ─────────────────────────────────────────────────────
  const supabaseStart = Date.now()
  try {
    const supabase = createAdminClient()
    const { error } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .limit(1)

    checks.supabase = {
      status: error ? 'error' : 'ok',
      latencyMs: Date.now() - supabaseStart,
      ...(error && { error: error.message }),
    }
  } catch (err) {
    checks.supabase = {
      status: 'error',
      latencyMs: Date.now() - supabaseStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }

  // ── Stripe ───────────────────────────────────────────────────────
  const stripeStart = Date.now()
  try {
    await stripe.balance.retrieve()
    checks.stripe = {
      status: 'ok',
      latencyMs: Date.now() - stripeStart,
    }
  } catch (err) {
    checks.stripe = {
      status: 'error',
      latencyMs: Date.now() - stripeStart,
      error: err instanceof Error ? err.message : 'Unknown error',
    }
  }

  // ── Resend (only if configured) ──────────────────────────────────
  if (process.env.RESEND_API_KEY) {
    const resendStart = Date.now()
    try {
      const res = await fetch('https://api.resend.com/domains', {
        headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}` },
      })
      checks.resend = {
        status: res.ok ? 'ok' : 'error',
        latencyMs: Date.now() - resendStart,
        ...(!res.ok && { error: `HTTP ${res.status}` }),
      }
    } catch (err) {
      checks.resend = {
        status: 'error',
        latencyMs: Date.now() - resendStart,
        error: err instanceof Error ? err.message : 'Unknown error',
      }
    }
  }

  // ── Overall ──────────────────────────────────────────────────────
  const allOk = Object.values(checks).every((c) => c.status === 'ok')

  return NextResponse.json(
    {
      status: allOk ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      services: checks,
    },
    {
      status: allOk ? 200 : 503,
      headers: { 'Cache-Control': 'no-store' },
    }
  )
}
