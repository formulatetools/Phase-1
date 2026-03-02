/**
 * Branding configuration — fetched from the `branding_config` table.
 * Admin can tweak settings in real-time via the Tools tab.
 * PDF generators read these at generation time.
 */

import { createServiceClient } from '@/lib/supabase/service'

// ─── Types ──────────────────────────────────────────────────────────────────

export interface BrandingConfig {
  freeStyle: 'diagonal' | 'footer'
  freeText: string
  freeOpacity: number        // 0-100
  freeFontSize: number       // pt (for diagonal)
  freeShowLogo: boolean
  freeLogoOpacity: number    // 0-100
  paidShowLogo: boolean
  paidLogoOpacity: number    // 0-100
}

/** Resolved branding options passed directly to PDF generators */
export interface PdfBrandingOptions {
  style: 'none' | 'diagonal' | 'footer'
  text: string
  opacity: number       // 0-1 (fraction)
  fontSize: number      // pt
  showLogo: boolean
  logoOpacity: number   // 0-1 (fraction)
}

// ─── Defaults (used when DB row is missing or fetch fails) ──────────────────

const DEFAULTS: BrandingConfig = {
  freeStyle: 'footer',
  freeText: 'Created with Formulate',
  freeOpacity: 50,
  freeFontSize: 48,
  freeShowLogo: true,
  freeLogoOpacity: 50,
  paidShowLogo: true,
  paidLogoOpacity: 30,
}

// ─── Fetch ──────────────────────────────────────────────────────────────────

export async function getBrandingConfig(): Promise<BrandingConfig> {
  try {
    const supabase = createServiceClient()
    const { data } = await supabase
      .from('branding_config')
      .select('*')
      .eq('id', 'global')
      .single()

    if (!data) return DEFAULTS

    return {
      freeStyle: (data.free_style as 'diagonal' | 'footer') || DEFAULTS.freeStyle,
      freeText: data.free_text ?? DEFAULTS.freeText,
      freeOpacity: data.free_opacity ?? DEFAULTS.freeOpacity,
      freeFontSize: data.free_font_size ?? DEFAULTS.freeFontSize,
      freeShowLogo: data.free_show_logo ?? DEFAULTS.freeShowLogo,
      freeLogoOpacity: data.free_logo_opacity ?? DEFAULTS.freeLogoOpacity,
      paidShowLogo: data.paid_show_logo ?? DEFAULTS.paidShowLogo,
      paidLogoOpacity: data.paid_logo_opacity ?? DEFAULTS.paidLogoOpacity,
    }
  } catch {
    // If the table doesn't exist yet (migration not run), return defaults
    return DEFAULTS
  }
}

// ─── Resolve ────────────────────────────────────────────────────────────────

/**
 * Given a therapist's tier and the global branding config,
 * resolve the concrete PDF branding options.
 */
export function resolveBranding(
  tier: string,
  config: BrandingConfig,
): PdfBrandingOptions {
  const isFree = tier === 'free'

  if (isFree) {
    return {
      style: config.freeStyle,
      text: config.freeText,
      opacity: config.freeOpacity / 100,
      fontSize: config.freeFontSize,
      showLogo: config.freeShowLogo,
      logoOpacity: config.freeLogoOpacity / 100,
    }
  }

  // All paid tiers: minimal logo mark, no watermark text
  return {
    style: config.paidShowLogo ? 'footer' : 'none',
    text: '',
    opacity: 0,
    fontSize: 0,
    showLogo: config.paidShowLogo,
    logoOpacity: config.paidLogoOpacity / 100,
  }
}

/**
 * Convenience: get the default branding config without a DB fetch.
 * Used in contexts where we can't do async (e.g. client components without server data).
 */
export function getDefaultBrandingConfig(): BrandingConfig {
  return { ...DEFAULTS }
}
