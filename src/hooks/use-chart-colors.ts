'use client'

import { useTheme } from '@/components/providers/theme-provider'

/**
 * Returns theme-aware colour values for Recharts components.
 * Recharts doesn't support CSS variables in SVG attributes,
 * so we resolve them based on the current theme.
 */
export function useChartColors() {
  const { resolved } = useTheme()
  const dark = resolved === 'dark'

  return {
    grid: dark ? '#253349' : '#f1f0ee',
    tick: dark ? '#94a3b8' : '#888',
    label: dark ? '#cbd5e1' : '#555',
    tooltipBg: dark ? '#1e293b' : '#ffffff',
    tooltipBorder: dark ? '#334155' : '#f1f0ee',
  }
}
