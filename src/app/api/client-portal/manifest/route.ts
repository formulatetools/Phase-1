import { NextRequest, NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/service'

// GET /api/client-portal/manifest?token=X — dynamic PWA manifest per client
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get('token')

  if (!token) {
    return NextResponse.json({ error: 'Missing token' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Verify the portal token exists
  const { data: relationship } = await supabase
    .from('therapeutic_relationships')
    .select('id')
    .eq('client_portal_token', token)
    .is('deleted_at', null)
    .single()

  if (!relationship) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const manifest = {
    name: 'My Therapy Workspace',
    short_name: 'Therapy',
    start_url: `/client/${token}`,
    display: 'standalone',
    background_color: '#fafaf8',
    theme_color: '#e4a930',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
