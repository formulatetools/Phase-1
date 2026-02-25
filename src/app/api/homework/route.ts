import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// POST /api/homework — save or submit a homework response
// Uses service role to bypass RLS (no auth required)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token, response_data, action } = body

    if (!token || !response_data) {
      return NextResponse.json({ error: 'Missing token or response_data' }, { status: 400 })
    }

    const supabase = createServiceClient()

    // Look up assignment by token
    const { data: assignment, error: lookupError } = await supabase
      .from('worksheet_assignments')
      .select('*')
      .eq('token', token)
      .is('deleted_at', null)
      .single()

    if (lookupError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 })
    }

    // Check if expired
    if (new Date(assignment.expires_at) < new Date()) {
      return NextResponse.json({ error: 'This assignment has expired' }, { status: 410 })
    }

    // Check if locked
    if (assignment.locked_at) {
      return NextResponse.json({ error: 'This assignment has been locked by your therapist' }, { status: 403 })
    }

    // Find existing response or create new one
    const { data: existingResponse } = await supabase
      .from('worksheet_responses')
      .select('id')
      .eq('assignment_id', assignment.id)
      .is('deleted_at', null)
      .single()

    if (existingResponse) {
      // Update existing response
      const updates: Record<string, unknown> = {
        response_data,
      }

      if (action === 'submit') {
        updates.completed_at = new Date().toISOString()
      }

      const { error: responseUpdateError } = await supabase
        .from('worksheet_responses')
        .update(updates)
        .eq('id', existingResponse.id)

      if (responseUpdateError) {
        console.error('Response update error:', responseUpdateError)
        return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
      }

      // Update assignment status
      const newStatus = action === 'submit' ? 'completed' : 'in_progress'
      const assignmentUpdates: Record<string, unknown> = { status: newStatus }
      if (action === 'submit') {
        assignmentUpdates.completed_at = new Date().toISOString()
      }

      const { error: assignmentUpdateError } = await supabase
        .from('worksheet_assignments')
        .update(assignmentUpdates)
        .eq('id', assignment.id)

      if (assignmentUpdateError) {
        console.error('Assignment update error:', assignmentUpdateError)
        return NextResponse.json({ error: 'Failed to update assignment status' }, { status: 500 })
      }

      return NextResponse.json({ success: true, responseId: existingResponse.id })
    } else {
      // Create new response
      const { data: newResponse, error: insertError } = await supabase
        .from('worksheet_responses')
        .insert({
          assignment_id: assignment.id,
          worksheet_id: assignment.worksheet_id,
          relationship_id: assignment.relationship_id,
          response_data,
          source: 'assigned',
          completed_at: action === 'submit' ? new Date().toISOString() : null,
        })
        .select('id')
        .single()

      if (insertError) {
        console.error('Insert error:', insertError)
        return NextResponse.json({ error: 'Failed to save response' }, { status: 500 })
      }

      // Update assignment status
      const newStatus = action === 'submit' ? 'completed' : 'in_progress'
      const assignmentUpdates: Record<string, unknown> = { status: newStatus }
      if (action === 'submit') {
        assignmentUpdates.completed_at = new Date().toISOString()
      }

      const { error: assignmentUpdateError2 } = await supabase
        .from('worksheet_assignments')
        .update(assignmentUpdates)
        .eq('id', assignment.id)

      if (assignmentUpdateError2) {
        console.error('Assignment update error:', assignmentUpdateError2)
        return NextResponse.json({ error: 'Failed to update assignment status' }, { status: 500 })
      }

      return NextResponse.json({ success: true, responseId: newResponse?.id })
    }
  } catch (err) {
    console.error('Homework API error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
