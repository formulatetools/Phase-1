import { NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/supabase/auth'
import { createClient } from '@/lib/supabase/server'
import { nanoid } from 'nanoid'

const MAGIC_BYTES: [string, number[], number][] = [
  ['image/png', [0x89, 0x50, 0x4e, 0x47], 0],
  ['image/jpeg', [0xff, 0xd8, 0xff], 0],
  ['image/webp', [0x52, 0x49, 0x46, 0x46], 0], // RIFF header; full check includes WEBP at offset 8
]

function detectImageType(buf: Buffer): string | null {
  for (const [mime, magic, offset] of MAGIC_BYTES) {
    if (buf.length < offset + magic.length) continue
    if (magic.every((b, i) => buf[offset + i] === b)) {
      // Extra check for WebP: bytes 8-11 must be "WEBP"
      if (mime === 'image/webp') {
        if (buf.length < 12 || buf.toString('ascii', 8, 12) !== 'WEBP') continue
      }
      return mime
    }
  }
  return null
}

export async function POST(request: Request) {
  try {
    const { user } = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File | null
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    // Validate file type by magic bytes (not just client-provided MIME)
    const buffer = Buffer.from(await file.arrayBuffer())
    const detectedType = detectImageType(buffer)
    if (!detectedType) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    const ext = detectedType === 'image/jpeg' ? 'jpg' : detectedType.split('/')[1]
    const path = `${user.id}/${nanoid()}.${ext}`

    const supabase = await createClient()
    const { error } = await supabase.storage.from('blog-images').upload(path, buffer, {
      contentType: detectedType,
      cacheControl: '31536000', // 1 year
    })

    if (error) {
      console.error('Upload error:', error)
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from('blog-images').getPublicUrl(path)

    return NextResponse.json({ url: publicUrl })
  } catch (err) {
    console.error('Image upload error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
