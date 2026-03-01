import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

export async function POST(request: Request) {
  try {
    const { portalToken, resourceId } = await request.json()

    if (!portalToken || !resourceId) {
      return NextResponse.json(
        { error: 'Missing portalToken or resourceId' },
        { status: 400 }
      )
    }

    const supabase = createServiceClient()

    // Look up relationship by portal token
    const { data: relationship } = await supabase
      .from('therapeutic_relationships')
      .select('id')
      .eq('client_portal_token', portalToken)
      .is('deleted_at', null)
      .single()

    if (!relationship) {
      return NextResponse.json({ error: 'Invalid portal token' }, { status: 404 })
    }

    // Verify the resource belongs to this relationship
    const { data: resource } = await supabase
      .from('shared_resources')
      .select('id, viewed_at, relationship_id')
      .eq('id', resourceId)
      .eq('relationship_id', relationship.id)
      .eq('status', 'active')
      .is('deleted_at', null)
      .single()

    if (!resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 })
    }

    // Only update viewed_at on first view
    if (!resource.viewed_at) {
      await supabase
        .from('shared_resources')
        .update({ viewed_at: new Date().toISOString() })
        .eq('id', resourceId)

      // Log event
      await supabase.from('homework_events').insert({
        relationship_id: relationship.id,
        event_type: 'resource_viewed',
        metadata: { resource_id: resourceId },
      })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
