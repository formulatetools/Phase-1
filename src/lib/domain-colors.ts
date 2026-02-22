// Domain colour mapping for formulation components
import type { DomainType } from '@/types/worksheet'

export const DOMAIN_COLORS: Record<DomainType, { bg: string; border: string; text: string; label: string }> = {
  situation:   { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', label: 'SITUATION' },
  thoughts:    { bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8', label: 'THOUGHTS' },
  emotions:    { bg: '#fef2f2', border: '#f87171', text: '#dc2626', label: 'EMOTIONS' },
  physical:    { bg: '#f0fdf4', border: '#4ade80', text: '#16a34a', label: 'PHYSICAL' },
  behaviour:   { bg: '#faf5ff', border: '#c084fc', text: '#9333ea', label: 'BEHAVIOUR' },
  reassurance: { bg: '#fdf6e3', border: '#e4a930', text: '#9a6e15', label: 'REASSURANCE' },
  attention:   { bg: '#f1f5f9', border: '#94a3b8', text: '#475569', label: 'ATTENTION' },
}

export function getDomainColor(domain?: DomainType) {
  if (!domain) return { bg: '#ffffff', border: '#e5e7eb', text: '#374151', label: '' }
  return DOMAIN_COLORS[domain]
}
