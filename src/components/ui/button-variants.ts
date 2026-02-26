// Server-safe button variant class strings.
// Import this in server components; import Button from ./button in client components.

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'ghost'
export type ButtonSize = 'sm' | 'md' | 'lg'

export const btnBase =
  'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50'

export const btnVariants: Record<ButtonVariant, string> = {
  primary: [
    'bg-primary-800 text-white font-semibold',
    'shadow-[var(--shadow-btn)]',
    'hover:bg-primary-900 hover:shadow-[var(--shadow-btn-hover)] hover:-translate-y-px',
    'dark:bg-primary-800 dark:text-primary-50 dark:hover:bg-primary-900',
  ].join(' '),

  secondary: [
    'border border-primary-200 bg-transparent text-primary-700',
    'hover:bg-primary-50 hover:border-primary-300',
    'dark:border-primary-200 dark:text-primary-600 dark:hover:bg-primary-100',
  ].join(' '),

  accent: [
    'bg-brand text-[#6b4d0f] font-semibold',
    'shadow-[var(--shadow-btn)]',
    'hover:bg-brand-dark hover:text-white hover:shadow-[var(--shadow-btn-hover)] hover:-translate-y-px',
  ].join(' '),

  ghost: [
    'bg-transparent text-primary-600',
    'hover:text-primary-800 hover:underline',
    'dark:text-primary-500 dark:hover:text-primary-700',
  ].join(' '),
}

export const btnSizes: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-sm',
}

/** Class string helpers for <Link>, <a>, and server components */
export const buttonVariants = {
  primary: (size: ButtonSize = 'md') => `${btnBase} ${btnVariants.primary} ${btnSizes[size]}`,
  secondary: (size: ButtonSize = 'md') => `${btnBase} ${btnVariants.secondary} ${btnSizes[size]}`,
  accent: (size: ButtonSize = 'md') => `${btnBase} ${btnVariants.accent} ${btnSizes[size]}`,
  ghost: (size: ButtonSize = 'md') => `${btnBase} ${btnVariants.ghost} ${btnSizes[size]}`,
}
