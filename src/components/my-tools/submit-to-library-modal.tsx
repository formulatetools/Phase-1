'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitToLibrary } from '@/app/(dashboard)/my-tools/actions'
import { useToast } from '@/hooks/use-toast'

interface Props {
  worksheetId: string
  categories: { id: string; name: string }[]
  agreementAccepted: boolean
  onClose: () => void
}

const AGREEMENT_TERMS = [
  'Worksheets you submit may be modified, updated, and distributed by Formulate.',
  'You retain the right to use your own content elsewhere.',
  'You receive permanent attribution on published worksheets for as long as they remain in the library.',
  'Formulate may remove worksheets from the library at any time (e.g. if clinical guidelines change).',
  'Your contributor access may be revoked at Formulate\'s discretion.',
]

export function SubmitToLibraryModal({ worksheetId, categories, agreementAccepted, onClose }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [clinicalContext, setClinicalContext] = useState('')
  const [suggestedCategory, setSuggestedCategory] = useState('')
  const [otherCategory, setOtherCategory] = useState('')
  const [referencesSources, setReferencesSources] = useState('')
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsAgreement = !agreementAccepted
  const canSubmit =
    clinicalContext.trim().length >= 200 &&
    !submitting &&
    (agreementAccepted || accepted)

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    const category = suggestedCategory === '__other__' ? otherCategory.trim() : suggestedCategory

    const result = await submitToLibrary(
      worksheetId,
      clinicalContext,
      category,
      referencesSources,
      needsAgreement ? accepted : false
    )

    if (result.error) {
      setError(result.error)
      setSubmitting(false)
    } else {
      toast({ type: 'success', message: 'Worksheet submitted to the library for review!' })
      router.push('/my-tools')
    }
  }

  const inputClass =
    'mt-1 block w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30 placeholder:text-primary-300'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-primary-100 bg-surface p-6 shadow-xl">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-1 text-primary-400 hover:bg-primary-50 hover:text-primary-600 transition-colors"
        >
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <h2 className="mb-1 text-lg font-semibold text-primary-900">Submit to Library</h2>
        <p className="mb-5 text-sm text-primary-400">
          Your worksheet will be reviewed before appearing in the public library.
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="space-y-4">
          {/* Clinical Context */}
          <div>
            <label htmlFor="clinicalContext" className="block text-sm font-medium text-primary-700">
              Clinical Context <span className="text-red-500">*</span>
            </label>
            <textarea
              id="clinicalContext"
              value={clinicalContext}
              onChange={(e) => setClinicalContext(e.target.value)}
              placeholder="Describe who this worksheet is for, when a therapist would use it, and what evidence base supports it."
              rows={5}
              className={inputClass}
            />
            <p className={`mt-1 text-xs ${clinicalContext.trim().length >= 200 ? 'text-green-600' : 'text-primary-400'}`}>
              {clinicalContext.trim().length}/200 characters minimum
            </p>
          </div>

          {/* Suggested Category */}
          <div>
            <label htmlFor="suggestedCategory" className="block text-sm font-medium text-primary-700">
              Suggested Category
            </label>
            <select
              id="suggestedCategory"
              value={suggestedCategory}
              onChange={(e) => setSuggestedCategory(e.target.value)}
              className={inputClass}
            >
              <option value="">Select a category...</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>{c.name}</option>
              ))}
              <option value="__other__">Other</option>
            </select>
            {suggestedCategory === '__other__' && (
              <input
                type="text"
                value={otherCategory}
                onChange={(e) => setOtherCategory(e.target.value)}
                placeholder="Enter category name"
                className={`${inputClass} mt-2`}
              />
            )}
          </div>

          {/* References */}
          <div>
            <label htmlFor="referencesSources" className="block text-sm font-medium text-primary-700">
              References / Source Material
            </label>
            <textarea
              id="referencesSources"
              value={referencesSources}
              onChange={(e) => setReferencesSources(e.target.value)}
              placeholder="List any papers, treatment manuals, or resources this worksheet draws from."
              rows={3}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-primary-400">Optional</p>
          </div>

          {/* Contributor Agreement (first-time only) */}
          {needsAgreement && (
            <div className="rounded-xl border border-primary-200 bg-primary-50/50 p-4">
              <p className="mb-3 text-sm font-medium text-primary-700">Contributor Agreement</p>
              <ul className="mb-4 space-y-2 text-xs text-primary-600">
                {AGREEMENT_TERMS.map((term, i) => (
                  <li key={i} className="flex gap-2">
                    <span className="mt-0.5 shrink-0 text-primary-400">{i + 1}.</span>
                    {term}
                  </li>
                ))}
              </ul>
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={accepted}
                  onChange={(e) => setAccepted(e.target.checked)}
                  className="mt-0.5 h-4 w-4 rounded border-primary-300 text-brand focus:ring-brand/30"
                />
                <span className="text-sm text-primary-700">
                  I agree to these terms
                </span>
              </label>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="rounded-lg px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!canSubmit}
            className="rounded-lg bg-green-600 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  )
}
