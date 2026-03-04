interface ProgressSectionProps {
  completedCount: number
  weeksActive: number
}

export function ProgressSection({ completedCount, weeksActive }: ProgressSectionProps) {
  // Only show if 2+ assignments completed
  if (completedCount < 2) return null

  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-semibold text-primary-800 border-b-2 border-brand pb-1 inline-block">Your Progress</h2>

      <div className="mt-4 space-y-3">
        <div>
          <p className="text-2xl font-bold text-primary-900">{completedCount}</p>
          <p className="text-xs text-primary-500 dark:text-primary-600">
            assignment{completedCount !== 1 ? 's' : ''} completed
          </p>
        </div>

        <p className="text-xs text-primary-400 dark:text-primary-600">
          {weeksActive} week{weeksActive !== 1 ? 's' : ''} active
        </p>
      </div>
    </div>
  )
}
