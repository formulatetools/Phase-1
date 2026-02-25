import { NextResponse, type NextRequest } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

const RETENTION_DAYS = parseInt(process.env.DATA_RETENTION_DAYS || '90', 10)

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel injects this for scheduled crons)
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createAdminClient()
  const threshold = new Date(Date.now() - RETENTION_DAYS * 86_400_000).toISOString()

  const results: Record<string, number> = {}

  // Delete in foreign-key-safe order (leaf tables first)
  const tables = [
    'worksheet_responses',
    'measure_administrations',
    'ema_responses',
    'ema_schedules',
    'worksheet_assignments',
    'therapeutic_relationships',
    'worksheets',
  ]

  for (const table of tables) {
    const { count } = await supabase
      .from(table)
      .delete({ count: 'exact' })
      .not('deleted_at', 'is', null)
      .lt('deleted_at', threshold)

    results[table] = count ?? 0
  }

  const total = Object.values(results).reduce((s, n) => s + n, 0)

  // Log to audit_log for compliance trail
  await supabase.from('audit_log').insert({
    user_id: null,
    action: 'delete',
    entity_type: 'data_retention',
    entity_id: 'cron_cleanup',
    metadata: { retention_days: RETENTION_DAYS, purged: results, total },
  })

  return NextResponse.json({ ok: true, retention_days: RETENTION_DAYS, purged: results, total })
}
