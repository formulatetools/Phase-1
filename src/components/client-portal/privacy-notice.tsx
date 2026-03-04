const checkIcon = (
  <svg
    className="mt-0.5 h-3 w-3 shrink-0 text-green-600"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={2}
    stroke="currentColor"
    aria-hidden="true"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
)

const items = [
  'Your data is stored securely and encrypted.',
  'Only you and your therapist can see your responses.',
  'You can delete any or all of your data at any time.',
  'Deletion is permanent and cannot be undone.',
]

export function PrivacyNotice() {
  return (
    <div className="rounded-2xl border border-primary-100 bg-primary-50/50 p-5 text-xs text-primary-500 space-y-2">
      <p className="font-medium text-primary-600">Your privacy</p>
      <ul className="space-y-1.5">
        {items.map((text) => (
          <li key={text} className="flex items-start gap-2">
            {checkIcon}
            {text}
          </li>
        ))}
      </ul>
    </div>
  )
}
