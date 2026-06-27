import { NextResponse } from 'next/server'
import { extractTextFromDocument } from '@/lib/document'
import { analyzeReport, analyzePhotoWithAI } from '@/lib/ai'
import { saveUploadedFile } from '@/lib/storage'

export const maxDuration = 60

const ALLOWED_DOC_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]
const ALLOWED_PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg']

export async function POST(request) {
  try {
    const formData = await request.formData()
    const document = formData.get('document')
    const photoEntries = formData.getAll('photos')

    console.log('Photos received:', photoEntries.length)

    if (!document || typeof document === 'string') {
      return NextResponse.json({ error: 'A PDF or Word document is required' }, { status: 400 })
    }

    if (!ALLOWED_DOC_TYPES.includes(document.type) && !document.name.match(/\.(pdf|docx)$/i)) {
      return NextResponse.json({ error: 'Document must be PDF or .docx' }, { status: 400 })
    }

    const docBuffer = Buffer.from(await document.arrayBuffer())
    const extractedText = await extractTextFromDocument(docBuffer, document.type, document.name)

    if (extractedText.length < 10) {
      return NextResponse.json({ error: 'Could not extract enough text from the document' }, { status: 400 })
    }

    const savedDoc = await saveUploadedFile(document, 'documents')
    const analysis = await analyzeReport(extractedText)

    const photos = []
    for (const entry of photoEntries) {
      if (!entry || typeof entry === 'string') continue
      if (!ALLOWED_PHOTO_TYPES.includes(entry.type)) continue

      const saved = await saveUploadedFile(entry, 'photos')
      const base64 = saved.buffer.toString('base64')
      const cv = await analyzePhotoWithAI(base64, entry.type, saved.fileName)

      console.log(`Photo: ${saved.fileName} → class: ${cv.violationClass} | summary: ${cv.summary}`)

      photos.push({
        fileName: saved.fileName,
        filePath: saved.relativePath,
        violationClass: cv.violationClass,
        summary: cv.summary,
        hasViolation: cv.hasViolation,
      })
    }

    // add photo check to checklist
    const checks = [...analysis.checks]
    if (photos.length > 0) {
      const anyViolation = photos.some(p => p.hasViolation || (p.violationClass && p.violationClass !== 'no_violation'))
      checks.push({
        label: 'Violation detected in photo evidence',
        pass: anyViolation,
        hint: anyViolation ? '' : 'Photos were uploaded but no violation was detected. Review manually.',
      })
    }

    return NextResponse.json({
      ...analysis,
      checks,
      text: extractedText,
      documentName: savedDoc.fileName,
      documentPath: savedDoc.relativePath,
      photos,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json(
      { error: error.message || 'Failed to analyze report' },
      { status: 500 }
    )
  }
}