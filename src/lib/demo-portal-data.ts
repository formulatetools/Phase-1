/**
 * Mock data for the "Therapy Workspace" demo tab on the landing page.
 * Uses realistic dates and maps to existing demo worksheet slugs so
 * "Open" / "Continue" links work via /hw/demo/[slug].
 */

import type { PortalResource } from '@/components/client-portal/resource-card'

// ─── Slug → demo page mapping ────────────────────────────────────────────

/** Maps demo worksheet IDs to their /hw/demo/[slug] route */
export const DEMO_SLUG_MAP: Record<string, string> = {
  'dw-1': '7-column-thought-record',
  'dw-2': 'graded-exposure-hierarchy',
  'dw-3': 'behavioural-activation-schedule',
}

// ─── Assignments ──────────────────────────────────────────────────────────

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString()
}
function daysFromNow(n: number) {
  return new Date(Date.now() + n * 86400000).toISOString()
}

export const DEMO_ASSIGNMENTS = [
  {
    id: 'da-1',
    token: 'demo',
    status: 'completed',
    worksheet_id: 'dw-1',
    assigned_at: daysAgo(14),
    due_date: daysAgo(7),
    expires_at: daysFromNow(90),
    completed_at: daysAgo(5),
  },
  {
    id: 'da-2',
    token: 'demo',
    status: 'in_progress',
    worksheet_id: 'dw-2',
    assigned_at: daysAgo(5),
    due_date: daysFromNow(2),
    expires_at: daysFromNow(14),
    completed_at: null,
  },
  {
    id: 'da-3',
    token: 'demo',
    status: 'assigned',
    worksheet_id: 'dw-3',
    assigned_at: daysAgo(0),
    due_date: daysFromNow(7),
    expires_at: daysFromNow(30),
    completed_at: null,
  },
]

// ─── Worksheets (title-only — for assignment card display) ────────────────

export const DEMO_PORTAL_WORKSHEETS = [
  { id: 'dw-1', title: '7-Column Thought Record' },
  { id: 'dw-2', title: 'Graded Exposure Hierarchy' },
  { id: 'dw-3', title: 'Behavioural Activation Schedule' },
]

// ─── Resources (YouTube videos with realistic OG data) ────────────────────
// Using well-known therapeutic technique videos with real YouTube IDs
// so thumbnails auto-render via img.youtube.com/vi/{id}/mqdefault.jpg

export const DEMO_RESOURCES: PortalResource[] = [
  {
    id: 'dr-1',
    resource_type: 'link',
    title: '5-4-3-2-1 Grounding Technique',
    therapist_note: 'Try this when you notice anxiety rising — works well as a first step before the exposure tasks.',
    shared_at: daysAgo(10),
    viewed_at: daysAgo(8),
    url: 'https://www.youtube.com/watch?v=30VMIEmA114',
    og_title: '5-4-3-2-1 Coping Technique for Anxiety',
    og_description: 'A simple grounding exercise using your five senses to bring yourself back to the present moment.',
    og_image_url: null,
    og_site_name: 'YouTube',
    article_id: null,
    article_summary: null,
    article_category: null,
    article_reading_time: null,
  },
  {
    id: 'dr-2',
    resource_type: 'link',
    title: 'Box Breathing Exercise',
    therapist_note: 'Good for before bed or before situations that feel challenging. Try it daily this week.',
    shared_at: daysAgo(5),
    viewed_at: null,
    url: 'https://www.youtube.com/watch?v=tEmt1Znux58',
    og_title: 'Box Breathing Relaxation Technique',
    og_description: 'A guided 4-4-4-4 breathing pattern used by therapists, Navy SEALs, and athletes for calm focus.',
    og_image_url: null,
    og_site_name: 'YouTube',
    article_id: null,
    article_summary: null,
    article_category: null,
    article_reading_time: null,
  },
]
