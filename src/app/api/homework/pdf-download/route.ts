import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// POST /api/homework/pdf-download — log that a client downloaded a blank PDF
// This is for the post-consent "Prefer pen and paper?" link, NOT the consent decline flow.
// Does NOT change assignment status — just records the timestamp and event.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token } = body

    if (!token) {
      return NextResponse.json({ error: 'Missing token' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Look up assignment by token
    const { data: assignment, error: lookupError } = await supabase
      .from('worksheet_assignments')
      .select('id, relationship_id')
      .eq('token', token)
      .is('deleted_at', null)
      .single()

    if (lookupError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Set pdf_downloaded_at timestamp (does NOT change status or completion_method)
    await supabase
      .from('worksheet_assignments')
      .update({ pdf_downloaded_at: new Date().toISOString() })
      .eq('id', assignment.id)

    // Log event
    await supabase.from('homework_events').insert({
      relationship_id: assignment.relationship_id,
      assignment_id: assignment.id,
      event_type: 'pdf_downloaded',
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('PDF download API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
