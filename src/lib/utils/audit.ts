import { createClient } from '@/lib/supabase/server'

type AuditAction = 'create' | 'read' | 'update' | 'delete' | 'export' | 'login' | 'logout' | 'assign' | 'share' | 'redeem'

/**
 * Server-side audit log helper.
 * Appends an entry to the audit_log table. This table is append-only —
 * no updates or deletes are permitted, even for admins.
 */
export async function auditLog({
  userId,
  action,
  entityType,
  entityId,
  metadata,
}: {
  userId: string
  action: AuditAction
  entityType: string
  entityId: string
  metadata?: Record<string, unknown>
}) {
  const supabase = await createClient()
  await supabase.from('audit_log').insert({
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata: metadata || null,
  })
}
