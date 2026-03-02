import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/admin/branding-config — fetch the global branding config
export async function GET() {
  try {
    const { user, profile } = await getCurrentUser()
    if (!user || !profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('branding_config')
      .select('*')
      .eq('id', 'global')
      .single()

    if (error) {
      console.error('Failed to fetch branding config:', error)
      return NextResponse.json({ error: 'Failed to fetch branding config' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Branding config GET error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}

// PUT /api/admin/branding-config — update the global branding config
export async function PUT(request: NextRequest) {
  try {
    const { user, profile } = await getCurrentUser()
    if (!user || !profile) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    if (profile.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()

    const supabase = createServiceClient()

    const { data, error } = await supabase
      .from('branding_config')
      .update({
        free_style: body.free_style,
        free_text: body.free_text,
        free_opacity: body.free_opacity,
        free_font_size: body.free_font_size,
        free_show_logo: body.free_show_logo,
        free_logo_opacity: body.free_logo_opacity,
        paid_show_logo: body.paid_show_logo,
        paid_logo_opacity: body.paid_logo_opacity,
        updated_at: new Date().toISOString(),
      })
      .eq('id', 'global')
      .select()
      .single()

    if (error) {
      console.error('Failed to update branding config:', error)
      return NextResponse.json({ error: 'Failed to update branding config' }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err) {
    console.error('Branding config PUT error:', err)
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
