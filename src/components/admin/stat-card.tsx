import type { ReactNode } from 'react'

interface StatCardProps {
  label: string
  value: string | number
  subtitle?: string
  icon: ReactNode
  iconBg?: string          // e.g. 'bg-brand/10'
  iconColor?: string       // e.g. 'text-brand'
  trend?: {
    value: number          // percentage change
    label: string          // e.g. 'vs last month'
  }
}

export function StatCard({
  label,
  value,
  subtitle,
  icon,
  iconBg = 'bg-brand/10',
  iconColor = 'text-brand',
  trend,
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-primary-100 bg-surface p-5 shadow-sm">
      <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${iconBg}`}>
        <div className={`h-5 w-5 ${iconColor}`}>{icon}</div>
      </div>
      <p className="mt-3 text-3xl font-bold text-primary-900">{value}</p>
      <p className="mt-0.5 text-sm text-primary-400">
        {label}
        {subtitle && (
          <span className="text-primary-300"> · {subtitle}</span>
        )}
      </p>
      {trend && (
        <p className={`mt-1 text-xs font-medium ${trend.value >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500 dark:text-red-400'}`}>
          {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}% {trend.label}
        </p>
      )}
    </div>
  )
}
