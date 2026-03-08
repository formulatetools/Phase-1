import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import type { WebhookFailure } from '@/types/database'
import { resolveWebhook, retryWebhook } from './actions'

export const metadata = { title: 'Webhook Failures — Admin — Formulate' }

export default async function AdminWebhooksPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()

  // Fetch failures — unresolved first, then most recent
  const { data: failures } = await supabase
    .from('webhook_failures')
    .select('*')
    .order('resolved_at', { ascending: true, nullsFirst: true })
    .order('created_at', { ascending: false })
    .limit(100)

  const webhookFailures = (failures || []) as WebhookFailure[]
  const unresolvedCount = webhookFailures.filter((f) => !f.resolved_at).length

  return (
    <div className="px-4 py-8 sm:px-8 lg:px-12">
      <div className="mb-2">
        <Link
          href="/admin"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand hover:text-brand-dark transition-colors"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Admin
        </Link>
      </div>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Webhook Failures</h1>
        <p className="mt-1 text-primary-400">
          {unresolvedCount > 0
            ? `${unresolvedCount} unresolved failure${unresolvedCount !== 1 ? 's' : ''}`
            : 'No unresolved failures'}
        </p>
      </div>

      {/* Failures table */}
      <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-100 bg-primary-50/50">
                <th className="px-4 py-3 text-left font-medium text-primary-500">Provider</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Event Type</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Error</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Retries</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">When</th>
                <th className="px-4 py-3 text-right font-medium text-primary-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {webhookFailures.map((failure) => {
                const isResolved = !!failure.resolved_at
                const boundResolve = resolveWebhook.bind(null, failure.id)
                const boundRetry = retryWebhook.bind(null, failure.id)

                return (
                  <tr key={failure.id} className="hover:bg-primary-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          failure.provider === 'stripe'
                            ? 'bg-purple-50 text-purple-700'
                            : 'bg-blue-50 text-blue-700'
                        }`}
                      >
                        {failure.provider}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-primary-600">
                      {failure.event_type || '—'}
                    </td>
                    <td className="px-4 py-3 text-primary-600 max-w-xs">
                      <p className="truncate" title={failure.error_message}>
                        {failure.error_message}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-primary-500">
                      {failure.retry_count}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                          isResolved
                            ? 'bg-green-50 text-green-700'
                            : 'bg-red-50 text-red-600'
                        }`}
                      >
                        {isResolved ? 'Resolved' : 'Open'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-400 whitespace-nowrap">
                      {new Date(failure.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {!isResolved && (
                        <div className="flex justify-end gap-2">
                          <form action={async () => { 'use server'; await boundRetry() }}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-brand hover:text-brand-dark transition-colors"
                            >
                              Retry
                            </button>
                          </form>
                          <form action={async () => { 'use server'; await boundResolve() }}>
                            <button
                              type="submit"
                              className="text-xs font-medium text-green-600 hover:text-green-700 transition-colors"
                            >
                              Resolve
                            </button>
                          </form>
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
              {webhookFailures.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                    No webhook failures recorded. That&apos;s great!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
