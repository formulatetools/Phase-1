'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import type { BrandingConfig } from '@/lib/branding'
import type { PdfBrandingOptions } from '@/lib/utils/fillable-pdf'
import { generateFillablePdf } from '@/lib/utils/fillable-pdf'
import type { WorksheetSchema } from '@/types/worksheet'

// ─── Types ──────────────────────────────────────────────────────────────────

interface BrandingConfiguratorProps {
  initialConfig: BrandingConfig
}

type PreviewTier = 'free' | 'paid'

/** Local config state mirrors BrandingConfig but owned by useState */
interface LocalConfig {
  freeStyle: 'diagonal' | 'footer'
  freeText: string
  freeOpacity: number
  freeFontSize: number
  freeShowLogo: boolean
  freeLogoOpacity: number
  paidShowLogo: boolean
  paidLogoOpacity: number
}

// ─── Sample schema for preview ──────────────────────────────────────────────

const SAMPLE_SCHEMA: WorksheetSchema = {
  version: 1,
  sections: [
    {
      id: 'preview',
      title: 'Sample Thought Record',
      description: 'This is a preview of how the branding will appear on exported PDFs.',
      fields: [
        { id: 'situation', type: 'text' as const, label: 'Situation', required: false },
        { id: 'thoughts', type: 'textarea' as const, label: 'Automatic Thoughts', required: false },
        { id: 'emotions', type: 'text' as const, label: 'Emotions', required: false },
      ],
    },
  ],
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function resolvePreview(config: LocalConfig, previewTier: PreviewTier): PdfBrandingOptions {
  if (previewTier === 'free') {
    return {
      style: config.freeStyle,
      text: config.freeText,
      opacity: config.freeOpacity / 100,
      fontSize: config.freeFontSize,
      showLogo: config.freeShowLogo,
      logoOpacity: config.freeLogoOpacity / 100,
    }
  }
  return {
    style: config.paidShowLogo ? 'footer' : 'none',
    text: '',
    opacity: 0,
    fontSize: 0,
    showLogo: config.paidShowLogo,
    logoOpacity: config.paidLogoOpacity / 100,
  }
}

// ─── Component ──────────────────────────────────────────────────────────────

export function BrandingConfigurator({ initialConfig }: BrandingConfiguratorProps) {
  // ── Local config state ──────────────────────────────────────────────────
  const [config, setConfig] = useState<LocalConfig>(() => ({ ...initialConfig }))
  const [previewTier, setPreviewTier] = useState<PreviewTier>('free')

  // ── Save state ──────────────────────────────────────────────────────────
  const [saving, setSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // ── Preview state ───────────────────────────────────────────────────────
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [generating, setGenerating] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)
  const blobUrlRef = useRef<string | null>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ── Config updaters ─────────────────────────────────────────────────────

  const update = useCallback(<K extends keyof LocalConfig>(key: K, value: LocalConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }, [])

  // ── Cleanup blob URLs ──────────────────────────────────────────────────

  useEffect(() => {
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
  }, [])

  // ── Debounced preview generation ───────────────────────────────────────

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current)
    }

    debounceRef.current = setTimeout(() => {
      generatePreview()
    }, 400)

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config, previewTier])

  async function generatePreview() {
    setGenerating(true)
    setPreviewError(null)

    try {
      const branding = resolvePreview(config, previewTier)
      const pdfBytes = await generateFillablePdf({
        schema: SAMPLE_SCHEMA,
        title: 'Branding Preview',
        description: 'Preview of branding configuration',
        branding,
      })

      const blob = new Blob([pdfBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      // Revoke previous blob URL
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current)
      }

      blobUrlRef.current = url
      setPreviewUrl(url)
    } catch (err) {
      console.error('Failed to generate PDF preview:', err)
      setPreviewError(err instanceof Error ? err.message : 'Failed to generate preview')
    } finally {
      setGenerating(false)
    }
  }

  // ── Save handler ───────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true)
    setSaveMessage(null)

    try {
      const res = await fetch('/api/admin/branding-config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || `Save failed (${res.status})`)
      }

      setSaveMessage({ type: 'success', text: 'Branding configuration saved successfully.' })
      // Auto-clear success message after 4 seconds
      setTimeout(() => setSaveMessage(null), 4000)
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save configuration.',
      })
    } finally {
      setSaving(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* ── Left Panel: Controls ────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Preview Tier Toggle */}
        <div className="rounded-xl border border-primary-200 bg-surface p-6">
          <h3 className="mb-4 text-sm font-semibold text-primary-900">Preview Tier</h3>
          <div className="border-b border-primary-100">
            <nav className="-mb-px flex" aria-label="Preview tier tabs">
              {(['free', 'paid'] as const).map((tier) => {
                const isActive = previewTier === tier
                return (
                  <button
                    key={tier}
                    onClick={() => setPreviewTier(tier)}
                    className={`relative flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-primary-900'
                        : 'text-primary-400 hover:text-primary-600'
                    }`}
                    aria-current={isActive ? 'page' : undefined}
                  >
                    {tier === 'free' ? 'Free Tier' : 'Paid Tier'}
                    {isActive && (
                      <span className="absolute inset-x-0 bottom-0 h-0.5 bg-brand" />
                    )}
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Free Tier Settings */}
        {previewTier === 'free' && (
          <div className="rounded-xl border border-primary-200 bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold text-primary-900">Free Tier Settings</h3>
            <div className="space-y-4">
              {/* Style */}
              <div>
                <label htmlFor="freeStyle" className="mb-1 block text-sm font-medium text-primary-700">
                  Style
                </label>
                <select
                  id="freeStyle"
                  value={config.freeStyle}
                  onChange={(e) => update('freeStyle', e.target.value as 'diagonal' | 'footer')}
                  className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="footer">Footer</option>
                  <option value="diagonal">Diagonal</option>
                </select>
              </div>

              {/* Watermark Text */}
              <div>
                <label htmlFor="freeText" className="mb-1 block text-sm font-medium text-primary-700">
                  Watermark Text
                </label>
                <input
                  id="freeText"
                  type="text"
                  value={config.freeText}
                  onChange={(e) => update('freeText', e.target.value)}
                  placeholder="Created with Formulate"
                  className="w-full rounded-lg border border-primary-200 bg-white px-3 py-2 text-sm text-primary-900 placeholder:text-primary-300 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
              </div>

              {/* Opacity */}
              <div>
                <label htmlFor="freeOpacity" className="mb-1 block text-sm font-medium text-primary-700">
                  Opacity
                </label>
                <div className="flex items-center gap-3">
                  <input
                    id="freeOpacity"
                    type="range"
                    min={0}
                    max={100}
                    value={config.freeOpacity}
                    onChange={(e) => update('freeOpacity', Number(e.target.value))}
                    className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-primary-100 accent-brand"
                  />
                  <span className="w-10 text-right text-sm tabular-nums text-primary-600">
                    {config.freeOpacity}%
                  </span>
                </div>
              </div>

              {/* Font Size (only for diagonal) */}
              {config.freeStyle === 'diagonal' && (
                <div>
                  <label htmlFor="freeFontSize" className="mb-1 block text-sm font-medium text-primary-700">
                    Font Size
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="freeFontSize"
                      type="range"
                      min={12}
                      max={72}
                      value={config.freeFontSize}
                      onChange={(e) => update('freeFontSize', Number(e.target.value))}
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-primary-100 accent-brand"
                    />
                    <span className="w-10 text-right text-sm tabular-nums text-primary-600">
                      {config.freeFontSize}pt
                    </span>
                  </div>
                </div>
              )}

              {/* Show Logo */}
              <div className="flex items-center gap-3">
                <input
                  id="freeShowLogo"
                  type="checkbox"
                  checked={config.freeShowLogo}
                  onChange={(e) => update('freeShowLogo', e.target.checked)}
                  className="h-4 w-4 rounded border-primary-300 text-brand accent-brand focus:ring-brand"
                />
                <label htmlFor="freeShowLogo" className="text-sm font-medium text-primary-700">
                  Show Logo
                </label>
              </div>

              {/* Logo Opacity (only when Show Logo is checked) */}
              {config.freeShowLogo && (
                <div>
                  <label htmlFor="freeLogoOpacity" className="mb-1 block text-sm font-medium text-primary-700">
                    Logo Opacity
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="freeLogoOpacity"
                      type="range"
                      min={0}
                      max={100}
                      value={config.freeLogoOpacity}
                      onChange={(e) => update('freeLogoOpacity', Number(e.target.value))}
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-primary-100 accent-brand"
                    />
                    <span className="w-10 text-right text-sm tabular-nums text-primary-600">
                      {config.freeLogoOpacity}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Paid Tier Settings */}
        {previewTier === 'paid' && (
          <div className="rounded-xl border border-primary-200 bg-surface p-6">
            <h3 className="mb-4 text-sm font-semibold text-primary-900">Paid Tier Settings</h3>
            <div className="space-y-4">
              {/* Show Logo */}
              <div className="flex items-center gap-3">
                <input
                  id="paidShowLogo"
                  type="checkbox"
                  checked={config.paidShowLogo}
                  onChange={(e) => update('paidShowLogo', e.target.checked)}
                  className="h-4 w-4 rounded border-primary-300 text-brand accent-brand focus:ring-brand"
                />
                <label htmlFor="paidShowLogo" className="text-sm font-medium text-primary-700">
                  Show Logo
                </label>
              </div>

              {/* Logo Opacity (only when Show Logo is checked) */}
              {config.paidShowLogo && (
                <div>
                  <label htmlFor="paidLogoOpacity" className="mb-1 block text-sm font-medium text-primary-700">
                    Logo Opacity
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      id="paidLogoOpacity"
                      type="range"
                      min={0}
                      max={100}
                      value={config.paidLogoOpacity}
                      onChange={(e) => update('paidLogoOpacity', Number(e.target.value))}
                      className="h-2 flex-1 cursor-pointer appearance-none rounded-lg bg-primary-100 accent-brand"
                    />
                    <span className="w-10 text-right text-sm tabular-nums text-primary-600">
                      {config.paidLogoOpacity}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Save Button & Status */}
        <div className="space-y-3">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center justify-center rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-brand-dark focus:outline-none focus:ring-2 focus:ring-brand focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {saving ? (
              <>
                <svg
                  className="-ml-1 mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Saving...
              </>
            ) : (
              'Save Configuration'
            )}
          </button>

          {saveMessage && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                saveMessage.type === 'success'
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
              role="alert"
            >
              {saveMessage.text}
            </div>
          )}
        </div>
      </div>

      {/* ── Right Panel: Live Preview ───────────────────────────────────── */}
      <div className="rounded-xl border border-primary-200 bg-surface p-6">
        <h3 className="mb-4 text-sm font-semibold text-primary-900">Live Preview</h3>

        <div className="relative">
          {/* Loading overlay */}
          {generating && (
            <div className="absolute inset-0 z-10 flex items-center justify-center rounded-lg bg-white/80">
              <div className="flex flex-col items-center gap-2">
                <svg
                  className="h-8 w-8 animate-spin text-brand"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                <span className="text-sm text-primary-500">Generating preview...</span>
              </div>
            </div>
          )}

          {/* Error state */}
          {previewError && !generating && (
            <div className="flex h-[500px] items-center justify-center rounded-lg border border-red-200 bg-red-50">
              <div className="px-6 text-center">
                <p className="text-sm font-medium text-red-800">Preview generation failed</p>
                <p className="mt-1 text-xs text-red-600">{previewError}</p>
                <button
                  onClick={() => generatePreview()}
                  className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* PDF iframe */}
          {!previewError && (
            <iframe
              src={previewUrl ?? 'about:blank'}
              title="PDF branding preview"
              className="h-[500px] w-full rounded-lg border border-primary-200 bg-white"
            />
          )}
        </div>
      </div>
    </div>
  )
}
