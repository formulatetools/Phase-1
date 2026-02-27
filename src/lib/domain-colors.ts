// Domain colour mapping for formulation components
import type { DomainType } from '@/types/worksheet'

// Legacy domain colours — used by curated formulations (section-based schema)
// Warm muted pastels that harmonise with amber (#e4a930) + charcoal (#2d2d2d) brand palette
export const DOMAIN_COLORS: Record<DomainType, { bg: string; border: string; text: string; label: string }> = {
  situation:   { bg: '#f3f2f0', border: '#a8a7a3', text: '#6b6a66', label: 'SITUATION' },
  thoughts:    { bg: '#eef2f8', border: '#8faed0', text: '#4a6e96', label: 'THOUGHTS' },
  emotions:    { bg: '#f8efef', border: '#d4a0a0', text: '#a05858', label: 'EMOTIONS' },
  physical:    { bg: '#eff5f1', border: '#9ec5aa', text: '#5a8a6a', label: 'PHYSICAL' },
  behaviour:   { bg: '#f2f0f6', border: '#b0a5cc', text: '#7668a0', label: 'BEHAVIOUR' },
  reassurance: { bg: '#fdf6e3', border: '#d4a44a', text: '#8a6e2e', label: 'REASSURANCE' },
  attention:   { bg: '#f3f2f0', border: '#a8a7a3', text: '#6b6a66', label: 'ATTENTION' },
}

export function getDomainColor(domain?: DomainType) {
  if (!domain) return { bg: '#ffffff', border: '#e5e7eb', text: '#374151', label: '' }
  return DOMAIN_COLORS[domain]
}

// ============================================================================
// New generalised domain colour palette — used by custom formulations
// Warm muted pastels matching the site's amber/charcoal aesthetic
// ============================================================================

export interface DomainColourPreset {
  label: string
  hex: string      // Primary hex colour (used in domain_colour on nodes)
  // Light mode
  bg: string
  border: string
  text: string
  // Dark mode
  bgDark: string
  borderDark: string
  textDark: string
}

export const DOMAIN_COLOUR_PALETTE: DomainColourPreset[] = [
  // ── Clinical domains (Five Areas / Cross-sectional) ──
  { label: 'Situation',     hex: '#8b8e94', bg: '#f3f2f0', border: '#a8a7a3', text: '#6b6a66', bgDark: '#22211f', borderDark: '#6b6a66', textDark: '#b0afab' },
  { label: 'Thoughts',      hex: '#5b7fb5', bg: '#eef2f8', border: '#8faed0', text: '#4a6e96', bgDark: '#1a2030', borderDark: '#5b7fb5', textDark: '#a3bdd8' },
  { label: 'Emotions',      hex: '#c46b6b', bg: '#f8efef', border: '#d4a0a0', text: '#a05858', bgDark: '#2a1818', borderDark: '#c46b6b', textDark: '#daa8a8' },
  { label: 'Physical',      hex: '#6b9e7e', bg: '#eff5f1', border: '#9ec5aa', text: '#5a8a6a', bgDark: '#182420', borderDark: '#6b9e7e', textDark: '#a5cbb2' },
  { label: 'Behaviour',     hex: '#8b7ab5', bg: '#f2f0f6', border: '#b0a5cc', text: '#7668a0', bgDark: '#201e2a', borderDark: '#8b7ab5', textDark: '#bdb0d4' },

  // ── Maintaining factors ──
  { label: 'Reassurance',   hex: '#d4a44a', bg: '#fdf6e3', border: '#d4a44a', text: '#8a6e2e', bgDark: '#2a2008', borderDark: '#d4a44a', textDark: '#e8c476' },
  { label: 'Attention',     hex: '#8b8e94', bg: '#f3f2f0', border: '#a8a7a3', text: '#6b6a66', bgDark: '#22211f', borderDark: '#6b6a66', textDark: '#b0afab' },

  // ── CFT Three Systems ──
  { label: 'Threat',        hex: '#c46b6b', bg: '#f8efef', border: '#d4a0a0', text: '#a05858', bgDark: '#2a1818', borderDark: '#c46b6b', textDark: '#daa8a8' },
  { label: 'Drive',         hex: '#5b7fb5', bg: '#eef2f8', border: '#8faed0', text: '#4a6e96', bgDark: '#1a2030', borderDark: '#5b7fb5', textDark: '#a3bdd8' },
  { label: 'Soothing',      hex: '#6b9e7e', bg: '#eff5f1', border: '#9ec5aa', text: '#5a8a6a', bgDark: '#182420', borderDark: '#6b9e7e', textDark: '#a5cbb2' },

  // ── Additional clinical domains ──
  { label: 'Core Beliefs',  hex: '#a07850', bg: '#f6f1eb', border: '#c4a880', text: '#806040', bgDark: '#262018', borderDark: '#a07850', textDark: '#c8aa82' },
  { label: 'Relationships', hex: '#b87090', bg: '#f6eff2', border: '#d0a0b4', text: '#986078', bgDark: '#281820', borderDark: '#b87090', textDark: '#d4a0b8' },
  { label: 'Motivation',    hex: '#c48a5a', bg: '#f6f0ea', border: '#d4b090', text: '#a07048', bgDark: '#2a2018', borderDark: '#c48a5a', textDark: '#d8b48a' },
  { label: 'Mindfulness',   hex: '#6b9e96', bg: '#eff5f3', border: '#9ec5be', text: '#5a8a82', bgDark: '#182422', borderDark: '#6b9e96', textDark: '#a5cbc4' },
  { label: 'Neutral',       hex: '#8b8e94', bg: '#f3f2f0', border: '#b0afab', text: '#6b6a66', bgDark: '#22211f', borderDark: '#6b6a66', textDark: '#b0afab' },
]

// Hex-to-colour mapping for custom formulations (mode-specific cache)
const hexToColourCache = new Map<string, { bg: string; border: string; text: string }>()
const hexToColourCacheDark = new Map<string, { bg: string; border: string; text: string }>()

/** Given a hex colour, return bg/border/text variants for the specified mode. */
export function getColourFromHex(hex: string, isDark = false): { bg: string; border: string; text: string } {
  // Check palette first
  const preset = DOMAIN_COLOUR_PALETTE.find(p => p.hex === hex)
  if (preset) {
    return isDark
      ? { bg: preset.bgDark, border: preset.borderDark, text: preset.textDark }
      : { bg: preset.bg, border: preset.border, text: preset.text }
  }

  // Check cache
  const cache = isDark ? hexToColourCacheDark : hexToColourCache
  const cached = cache.get(hex)
  if (cached) return cached

  // Derive from hex
  const result = isDark
    ? {
        bg: `${hex}18`,       // ~9% opacity (subtle tint on dark)
        border: `${hex}60`,   // ~38% opacity (muted border)
        text: `${hex}cc`,     // ~80% opacity (readable text)
      }
    : {
        bg: `${hex}14`,       // ~8% opacity
        border: `${hex}80`,   // ~50% opacity
        text: hex,
      }

  cache.set(hex, result)
  return result
}
