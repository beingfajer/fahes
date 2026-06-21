import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { resolveUploadPath } from '@/lib/storage'

export async function GET(request, { params }) {
  try {
    const { path: segments } = await params
    const relativePath = Array.isArray(segments) ? segments.join('/') : segments
    const fullPath = resolveUploadPath(relativePath)

    const buffer = await readFile(fullPath)
    const ext = path.extname(fullPath).toLowerCase()

    const types = {
      '.pdf': 'application/pdf',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.webp': 'image/webp',
    }

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': types[ext] || 'application/octet-stream',
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch {
    return NextResponse.json({ error: 'File not found' }, { status: 404 })
  }
}
