'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { submitReview } from '../actions'
import { useToast } from '@/hooks/use-toast'
import type { WorksheetReview, ClinicalAccuracy, ReviewCompleteness, ReviewUsability, ReviewRecommendation } from '@/types/database'

interface Props {
  worksheetId: string
  existingReview: WorksheetReview
  isCompleted: boolean
}

const ACCURACY_OPTIONS: { value: ClinicalAccuracy; label: string; description: string }[] = [
  { value: 'accurate', label: 'Accurate', description: 'Content is evidence-based and correctly represented' },
  { value: 'minor_issues', label: 'Minor Issues', description: 'Mostly accurate with small corrections needed' },
  { value: 'significant_concerns', label: 'Significant Concerns', description: 'Content has notable accuracy problems' },
]

const COMPLETENESS_OPTIONS: { value: ReviewCompleteness; label: string; description: string }[] = [
  { value: 'complete', label: 'Complete', description: 'Covers everything needed for the stated purpose' },
  { value: 'missing_elements', label: 'Missing Elements', description: 'Some important sections or content missing' },
  { value: 'incomplete', label: 'Incomplete', description: 'Major gaps that limit clinical utility' },
]

const USABILITY_OPTIONS: { value: ReviewUsability; label: string; description: string }[] = [
  { value: 'ready', label: 'Ready to Use', description: 'Would work well in clinical practice as-is' },
  { value: 'needs_refinement', label: 'Needs Refinement', description: 'Instructions or layout need improvement' },
  { value: 'major_issues', label: 'Major Issues', description: 'Not suitable for clinical use without significant changes' },
]

const RECOMMENDATION_OPTIONS: { value: ReviewRecommendation; label: string; color: string }[] = [
  { value: 'approve', label: 'Approve', color: 'border-green-300 bg-green-50 text-green-800' },
  { value: 'approve_with_edits', label: 'Approve with Minor Edits', color: 'border-blue-300 bg-blue-50 text-blue-800' },
  { value: 'revise_resubmit', label: 'Revise and Resubmit', color: 'border-orange-300 bg-orange-50 text-orange-800' },
  { value: 'reject', label: 'Reject', color: 'border-red-300 bg-red-50 text-red-800' },
]

export function ReviewForm({ worksheetId, existingReview, isCompleted }: Props) {
  const router = useRouter()
  const { toast } = useToast()

  const [clinicalAccuracy, setClinicalAccuracy] = useState<ClinicalAccuracy | ''>(existingReview.clinical_accuracy || '')
  const [clinicalAccuracyNotes, setClinicalAccuracyNotes] = useState(existingReview.clinical_accuracy_notes || '')
  const [completeness, setCompleteness] = useState<ReviewCompleteness | ''>(existingReview.completeness || '')
  const [completenessNotes, setCompletenessNotes] = useState(existingReview.completeness_notes || '')
  const [usability, setUsability] = useState<ReviewUsability | ''>(existingReview.usability || '')
  const [usabilityNotes, setUsabilityNotes] = useState(existingReview.usability_notes || '')
  const [suggestedChanges, setSuggestedChanges] = useState(existingReview.suggested_changes || '')
  const [recommendation, setRecommendation] = useState<ReviewRecommendation | ''>(existingReview.recommendation || '')
  const [submitting, setSubmitting] = useState(false)

  const canSubmit = clinicalAccuracy && completeness && usability && recommendation

  const handleSubmit = async () => {
    if (!canSubmit) {
      toast({ type: 'error', message: 'Please complete all rating fields and provide a recommendation' })
      return
    }

    if (!window.confirm('Submit your review? This cannot be changed afterwards.')) return

    setSubmitting(true)
    try {
      const result = await submitReview(worksheetId, {
        clinical_accuracy: clinicalAccuracy as ClinicalAccuracy,
        clinical_accuracy_notes: clinicalAccuracyNotes || null,
        completeness: completeness as ReviewCompleteness,
        completeness_notes: completenessNotes || null,
        usability: usability as ReviewUsability,
        usability_notes: usabilityNotes || null,
        suggested_changes: suggestedChanges || null,
        recommendation: recommendation as ReviewRecommendation,
      })
      if (!result.success) {
        toast({ type: 'error', message: result.error || 'Failed to submit review' })
        return
      }
      toast({ type: 'success', message: 'Review submitted successfully' })
      router.push('/dashboard')
    } catch {
      toast({ type: 'error', message: 'Failed to submit review' })
    } finally {
      setSubmitting(false)
    }
  }

  // Completed review — read-only display
  if (isCompleted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-surface p-6 shadow-sm">
        <div className="flex items-center gap-2 mb-5">
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h2 className="text-base font-semibold text-primary-900">Your Review</h2>
          <span className="text-xs text-primary-400">
            Submitted {new Date(existingReview.completed_at!).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
        </div>

        <div className="space-y-4">
          <CompletedField label="Clinical Accuracy" value={existingReview.clinical_accuracy} notes={existingReview.clinical_accuracy_notes} />
          <CompletedField label="Completeness" value={existingReview.completeness} notes={existingReview.completeness_notes} />
          <CompletedField label="Usability" value={existingReview.usability} notes={existingReview.usability_notes} />
          {existingReview.suggested_changes && (
            <div>
              <p className="text-xs font-medium text-primary-500 mb-1">Suggested Changes</p>
              <p className="text-sm text-primary-700 whitespace-pre-wrap">{existingReview.suggested_changes}</p>
            </div>
          )}
          <div>
            <p className="text-xs font-medium text-primary-500 mb-1">Recommendation</p>
            <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium bg-primary-100 text-primary-700">
              {RECOMMENDATION_OPTIONS.find(o => o.value === existingReview.recommendation)?.label || existingReview.recommendation}
            </span>
          </div>
        </div>
      </div>
    )
  }

  // Active review form
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-6 shadow-sm">
      <h2 className="mb-1 text-base font-semibold text-primary-900">Your Clinical Review</h2>
      <p className="mb-6 text-sm text-primary-400">Evaluate the worksheet across the following dimensions</p>

      <div className="space-y-8">
        {/* Clinical Accuracy */}
        <RatingSection
          title="Clinical Accuracy"
          description="Is the content evidence-based and correctly represented?"
          options={ACCURACY_OPTIONS}
          value={clinicalAccuracy}
          onChange={(v) => setClinicalAccuracy(v as ClinicalAccuracy)}
          notes={clinicalAccuracyNotes}
          onNotesChange={setClinicalAccuracyNotes}
          notesPlaceholder="Any specific accuracy concerns or comments..."
        />

        {/* Completeness */}
        <RatingSection
          title="Completeness"
          description="Does the worksheet cover what it needs to for the stated purpose?"
          options={COMPLETENESS_OPTIONS}
          value={completeness}
          onChange={(v) => setCompleteness(v as ReviewCompleteness)}
          notes={completenessNotes}
          onNotesChange={setCompletenessNotes}
          notesPlaceholder="What elements are missing, if any..."
        />

        {/* Usability */}
        <RatingSection
          title="Usability"
          description="Would this work well in clinical practice? Are instructions clear?"
          options={USABILITY_OPTIONS}
          value={usability}
          onChange={(v) => setUsability(v as ReviewUsability)}
          notes={usabilityNotes}
          onNotesChange={setUsabilityNotes}
          notesPlaceholder="Any usability concerns or suggestions..."
        />

        {/* Suggested Changes */}
        <div>
          <h3 className="text-sm font-semibold text-primary-900 mb-1">Suggested Changes</h3>
          <p className="text-xs text-primary-400 mb-3">Any other changes or improvements you would recommend</p>
          <textarea
            aria-label="Suggested changes"
            value={suggestedChanges}
            onChange={(e) => setSuggestedChanges(e.target.value)}
            rows={4}
            placeholder="Describe any additional changes or improvements..."
            className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
          />
        </div>

        {/* Overall Recommendation */}
        <div>
          <h3 className="text-sm font-semibold text-primary-900 mb-1">Overall Recommendation</h3>
          <p className="text-xs text-primary-400 mb-3">What is your recommendation for this worksheet?</p>
          <div className="grid grid-cols-2 gap-2">
            {RECOMMENDATION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRecommendation(opt.value)}
                className={`rounded-lg border-2 px-4 py-3 text-sm font-medium transition-all ${
                  recommendation === opt.value
                    ? opt.color
                    : 'border-primary-100 bg-surface text-primary-600 hover:border-primary-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Submit button */}
        <div className="pt-2 border-t border-primary-100">
          <button
            onClick={handleSubmit}
            disabled={submitting || !canSubmit}
            className="w-full rounded-lg bg-green-600 px-6 py-3 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {submitting ? 'Submitting Review...' : 'Submit Review'}
          </button>
          {!canSubmit && (
            <p className="mt-2 text-center text-xs text-primary-400">
              Please complete all rating fields and select a recommendation
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Rating section component ─────────────────────────────────────

function RatingSection({
  title,
  description,
  options,
  value,
  onChange,
  notes,
  onNotesChange,
  notesPlaceholder,
}: {
  title: string
  description: string
  options: { value: string; label: string; description: string }[]
  value: string
  onChange: (value: string) => void
  notes: string
  onNotesChange: (value: string) => void
  notesPlaceholder: string
}) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-primary-900 mb-1">{title}</h3>
      <p className="text-xs text-primary-400 mb-3">{description}</p>
      <div className="space-y-2 mb-3">
        {options.map((opt) => (
          <label
            key={opt.value}
            className={`flex items-start gap-3 rounded-lg border-2 px-4 py-3 cursor-pointer transition-all ${
              value === opt.value
                ? 'border-brand bg-brand/5'
                : 'border-primary-100 hover:border-primary-200'
            }`}
          >
            <input
              type="radio"
              name={title.toLowerCase().replace(/\s/g, '_')}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              className="mt-0.5 h-4 w-4 text-brand focus:ring-brand/30"
            />
            <div>
              <span className="text-sm font-medium text-primary-900">{opt.label}</span>
              <p className="text-xs text-primary-400">{opt.description}</p>
            </div>
          </label>
        ))}
      </div>
      <textarea
        aria-label={`${title} notes`}
        value={notes}
        onChange={(e) => onNotesChange(e.target.value)}
        rows={2}
        placeholder={notesPlaceholder}
        className="w-full rounded-lg border border-primary-200 px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand/30"
      />
    </div>
  )
}

// ── Completed field display ──────────────────────────────────────

function CompletedField({ label, value, notes }: { label: string; value: string | null; notes: string | null }) {
  const displayValue = value?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'N/A'
  return (
    <div>
      <p className="text-xs font-medium text-primary-500 mb-1">{label}</p>
      <p className="text-sm font-medium text-primary-900">{displayValue}</p>
      {notes && <p className="mt-0.5 text-xs text-primary-600">{notes}</p>}
    </div>
  )
}
