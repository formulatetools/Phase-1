interface ProgressSectionProps {
  completedCount: number
  weeksActive: number
}

export function ProgressSection({ completedCount, weeksActive }: ProgressSectionProps) {
  // Only show if 2+ assignments completed
  if (completedCount < 2) return null

  // Use a logarithmic-ish scale so the bar feels meaningful across a wider range
  // 5 completions ≈ 50%, 10 ≈ 70%, 20 ≈ 85%, never quite reaches 100%
  const progressPercent = Math.min(95, Math.round((1 - 1 / (1 + completedCount * 0.15)) * 100))

  const avgPerWeek = weeksActive > 0
    ? (completedCount / weeksActive).toFixed(1)
    : null

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

        {/* Progress bar */}
        <div
          className="h-1.5 w-full overflow-hidden rounded-full bg-primary-100"
          role="progressbar"
          aria-valuenow={completedCount}
          aria-valuemin={0}
          aria-label={`${completedCount} assignments completed`}
        >
          <div
            className="h-full rounded-full bg-brand transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        <p className="text-xs text-primary-400 dark:text-primary-600">
          {weeksActive} week{weeksActive !== 1 ? 's' : ''} active
          {avgPerWeek && weeksActive >= 2 && (
            <span className="ml-1">
              &middot; ~{avgPerWeek}/week
            </span>
          )}
        </p>
      </div>
    </div>
  )
}
