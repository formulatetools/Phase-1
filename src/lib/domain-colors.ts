// Domain colour mapping for formulation components
import type { DomainType } from '@/types/worksheet'

// Legacy domain colours — used by curated formulations (section-based schema)
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

// ============================================================================
// New generalised domain colour palette — used by custom formulations
// ============================================================================

export interface DomainColourPreset {
  label: string
  hex: string      // Primary hex colour (used in domain_colour on nodes)
  bg: string       // Light background
  border: string   // Border colour
  text: string     // Text colour for labels
}

export const DOMAIN_COLOUR_PALETTE: DomainColourPreset[] = [
  { label: 'Situation',     hex: '#64748b', bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
  { label: 'Thoughts',      hex: '#2563eb', bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8' },
  { label: 'Emotions',      hex: '#dc2626', bg: '#fef2f2', border: '#f87171', text: '#dc2626' },
  { label: 'Physical',      hex: '#16a34a', bg: '#f0fdf4', border: '#4ade80', text: '#16a34a' },
  { label: 'Behaviour',     hex: '#9333ea', bg: '#faf5ff', border: '#c084fc', text: '#9333ea' },
  { label: 'Reassurance',   hex: '#e4a930', bg: '#fdf6e3', border: '#e4a930', text: '#9a6e15' },
  { label: 'Attention',     hex: '#64748b', bg: '#f1f5f9', border: '#94a3b8', text: '#475569' },
  { label: 'Threat',        hex: '#dc2626', bg: '#fef2f2', border: '#f87171', text: '#dc2626' },
  { label: 'Drive',         hex: '#2563eb', bg: '#eff6ff', border: '#60a5fa', text: '#1d4ed8' },
  { label: 'Soothing',      hex: '#16a34a', bg: '#f0fdf4', border: '#4ade80', text: '#16a34a' },
  { label: 'Core Beliefs',  hex: '#92400e', bg: '#fef3c7', border: '#d97706', text: '#92400e' },
  { label: 'Relationships', hex: '#db2777', bg: '#fdf2f8', border: '#f472b6', text: '#db2777' },
  { label: 'Motivation',    hex: '#ea580c', bg: '#fff7ed', border: '#fb923c', text: '#ea580c' },
  { label: 'Mindfulness',   hex: '#0d9488', bg: '#f0fdfa', border: '#2dd4bf', text: '#0d9488' },
  { label: 'Neutral',       hex: '#6b7280', bg: '#f9fafb', border: '#d1d5db', text: '#6b7280' },
]

// Hex-to-colour mapping for custom formulations
const hexToColourCache = new Map<string, { bg: string; border: string; text: string }>()

/** Given a hex colour, return bg/border/text variants. Uses palette lookup first, then derives. */
export function getColourFromHex(hex: string): { bg: string; border: string; text: string } {
  // Check palette first
  const preset = DOMAIN_COLOUR_PALETTE.find(p => p.hex === hex)
  if (preset) return { bg: preset.bg, border: preset.border, text: preset.text }

  // Check cache
  const cached = hexToColourCache.get(hex)
  if (cached) return cached

  // Derive from hex: bg = hex at 8% opacity, border = hex at 50% opacity, text = hex
  const result = {
    bg: `${hex}14`,       // ~8% opacity
    border: `${hex}80`,   // ~50% opacity
    text: hex,
  }
  hexToColourCache.set(hex, result)
  return result
}
