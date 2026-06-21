import { NextResponse } from 'next/server'
import { extractTextFromDocument } from '@/lib/document'
import { analyzeReport } from '@/lib/ai'
import { analyzePhoto, mergePhotoChecks } from '@/lib/roboflow'
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
      const cv = await analyzePhoto(saved.relativePath, extractedText) // passes report text for fallback routing

      console.log(`Photo: ${saved.fileName} → detections: ${cv.detections.length} | source: ${cv.source} | summary: ${cv.summary}`)

      photos.push({
        fileName: saved.fileName,
        filePath: saved.relativePath,
        detections: cv.detections,
        summary: cv.summary,
        source: cv.source,
      })
    }

    const checks = mergePhotoChecks(analysis.checks, photos)

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