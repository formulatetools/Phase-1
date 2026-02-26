import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { TIER_LABELS } from '@/lib/stripe/config'
import type { PromoCode } from '@/types/database'
import { createPromoCode, togglePromoCodeActive } from './actions'

export const metadata = { title: 'Promo Codes — Admin — Formulate' }

export default async function AdminPromoCodesPage() {
  const { user, profile } = await getCurrentUser()
  if (!user || !profile || profile.role !== 'admin') redirect('/dashboard')

  const supabase = await createClient()
  const { data: codes } = await supabase
    .from('promo_codes')
    .select('*')
    .order('created_at', { ascending: false })

  const promoCodes = (codes || []) as PromoCode[]

  function getStatus(pc: PromoCode): { label: string; color: string } {
    if (!pc.is_active) return { label: 'Inactive', color: 'bg-primary-100 text-primary-500' }
    if (pc.expires_at && new Date(pc.expires_at) < new Date()) return { label: 'Expired', color: 'bg-red-50 text-red-600' }
    if (pc.max_redemptions !== null && pc.redemption_count >= pc.max_redemptions) return { label: 'Maxed', color: 'bg-amber-50 text-amber-600' }
    return { label: 'Active', color: 'bg-green-50 text-green-700' }
  }

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
        <h1 className="text-2xl font-bold text-primary-900 sm:text-3xl">Promo Codes</h1>
        <p className="mt-1 text-primary-400">Create and manage promotional access codes</p>
      </div>

      {/* Create form */}
      <div className="mb-8 rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-primary-900">Create New Code</h2>
        <form action={async (formData: FormData) => { 'use server'; await createPromoCode(formData) }} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <div>
            <label className="block text-xs font-medium text-primary-500 mb-1">Code</label>
            <input
              name="code"
              type="text"
              required
              placeholder="e.g. LAUNCH50"
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 uppercase tracking-wider placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-500 mb-1">Tier</label>
            <select
              name="tier"
              required
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
            >
              <option value="starter">{TIER_LABELS.starter}</option>
              <option value="standard">{TIER_LABELS.standard}</option>
              <option value="professional">{TIER_LABELS.professional}</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-500 mb-1">Duration (days)</label>
            <input
              name="duration_days"
              type="number"
              required
              min={1}
              placeholder="30"
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-primary-500 mb-1">Max Uses <span className="text-primary-300">(optional)</span></label>
            <input
              name="max_redemptions"
              type="number"
              min={1}
              placeholder="Unlimited"
              className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 placeholder-primary-400 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
            />
          </div>
          <div className="flex items-end">
            <button
              type="submit"
              className="w-full rounded-lg bg-primary-800 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-primary-900 dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900"
            >
              Create Code
            </button>
          </div>
        </form>
      </div>

      {/* Codes table */}
      <div className="rounded-2xl border border-primary-100 bg-surface shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-primary-100 bg-primary-50/50">
                <th className="px-4 py-3 text-left font-medium text-primary-500">Code</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Tier</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Duration</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Redemptions</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Status</th>
                <th className="px-4 py-3 text-left font-medium text-primary-500">Created</th>
                <th className="px-4 py-3 text-right font-medium text-primary-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-50">
              {promoCodes.map((pc) => {
                const status = getStatus(pc)
                const boundToggle = togglePromoCodeActive.bind(null, pc.id)
                const toggleAction = async () => { 'use server'; await boundToggle() }
                return (
                  <tr key={pc.id} className="hover:bg-primary-50/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-semibold text-primary-900 tracking-wider">
                      {pc.code}
                    </td>
                    <td className="px-4 py-3 text-primary-600">
                      {TIER_LABELS[pc.tier] || pc.tier}
                    </td>
                    <td className="px-4 py-3 text-primary-600">
                      {pc.duration_days}d
                    </td>
                    <td className="px-4 py-3 text-primary-600">
                      {pc.redemption_count}/{pc.max_redemptions ?? '\u221E'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${status.color}`}>
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-primary-400">
                      {new Date(pc.created_at).toLocaleDateString('en-GB', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <form action={toggleAction}>
                        <button
                          type="submit"
                          className={`text-xs font-medium transition-colors ${
                            pc.is_active
                              ? 'text-red-500 hover:text-red-700'
                              : 'text-green-600 hover:text-green-700'
                          }`}
                        >
                          {pc.is_active ? 'Disable' : 'Enable'}
                        </button>
                      </form>
                    </td>
                  </tr>
                )
              })}
              {promoCodes.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-primary-400">
                    No promo codes yet. Create one above.
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
