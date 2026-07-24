import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import path from 'path'
import { reportRepository } from '@/repositories/reportRepository'
import { resolveUploadPath } from '@/lib/storage'

const DOC_TYPES = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const doc = await reportRepository.findDocumentById(id)
    if (!doc) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    let buffer = doc.documentData ? Buffer.from(doc.documentData) : null

    // Older reports only stored a disk path
    if (!buffer && doc.documentPath) {
      try {
        buffer = await readFile(resolveUploadPath(doc.documentPath))
      } catch {
        buffer = null
      }
    }

    if (!buffer) {
      return NextResponse.json(
        { error: 'The original document file is no longer available' },
        { status: 404 }
      )
    }

    const fileName = doc.documentName || `report${path.extname(doc.documentPath || '') || '.docx'}`
    const ext = path.extname(fileName).toLowerCase()

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': DOC_TYPES[ext] || 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`,
        'Cache-Control': 'private, max-age=3600',
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to load document' }, { status: 500 })
  }
}
