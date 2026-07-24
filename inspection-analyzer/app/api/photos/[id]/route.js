import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { reportRepository } from '@/repositories/reportRepository'
import { resolveUploadPath } from '@/lib/storage'

const IMAGE_TYPES = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const photo = await reportRepository.findPhotoById(id)
    if (!photo) {
      return NextResponse.json({ error: 'Photo not found' }, { status: 404 })
    }

    let buffer = photo.data ? Buffer.from(photo.data) : null

    // Older photos only stored a disk path
    if (!buffer && photo.filePath) {
      try {
        buffer = await readFile(resolveUploadPath(photo.filePath))
      } catch {
        buffer = null
      }
    }

    if (!buffer) {
      return NextResponse.json({ error: 'The photo file is no longer available' }, { status: 404 })
    }

    const ext = path.extname(photo.fileName || photo.filePath || '').toLowerCase()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': IMAGE_TYPES[ext] || 'image/jpeg',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load photo' }, { status: 500 })
  }
}
