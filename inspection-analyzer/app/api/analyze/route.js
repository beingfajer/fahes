import { NextResponse } from 'next/server'
import { extractTextFromDocument } from '@/lib/document'
import { analyzeReport, analyzePhotoWithAI } from '@/lib/ai'
import {
  reportMentionsViolation,
  extractClaimedViolations,
  buildClaimPhotoChecks,
} from '@/lib/report'
import { saveBuffer, saveUploadedFile } from '@/lib/storage'

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

    const savedDoc = await saveBuffer(docBuffer, document.name, 'documents')
    const analysis = await analyzeReport(extractedText)

    const mentionsViolation = reportMentionsViolation(extractedText)
    const claimedViolations = extractClaimedViolations(extractedText)
    console.log('Claimed violations:', claimedViolations.map(c => c.id).join(', ') || '(none)')

    const photos = []
    for (const entry of photoEntries) {
      if (!entry || typeof entry === 'string') continue
      if (!ALLOWED_PHOTO_TYPES.includes(entry.type)) continue

      const saved = await saveUploadedFile(entry, 'photos')
      const base64 = saved.buffer.toString('base64')
      const cv = await analyzePhotoWithAI(base64, entry.type, saved.fileName, claimedViolations)

      console.log(`Photo: ${saved.fileName} → class: ${cv.violationClass} | summary: ${cv.summary}`)

      photos.push({
        fileName: saved.fileName,
        filePath: saved.relativePath,
        data: base64,
        violationClass: cv.violationClass,
        summary: cv.summary,
        hasViolation: cv.hasViolation,
      })
    }

    // Prefer per-claim photo matching when the report names specific issues
    const checks = [...analysis.checks]
    const claimChecks = buildClaimPhotoChecks(claimedViolations, photos)

    if (claimChecks.length > 0) {
      checks.push(...claimChecks.map(({ label, pass, hint }) => ({ label, pass, hint })))
    } else if (mentionsViolation && photos.length === 0) {
      checks.push({
        label: 'Violation photo evidence uploaded',
        pass: false,
        hint: 'The report states a violation was found, but no supporting photos were uploaded.',
      })
    } else if (photos.length > 0) {
      const anyViolation = photos.some(p => p.hasViolation || (p.violationClass && p.violationClass !== 'no_violation'))
      checks.push({
        label: 'Violation detected in photo evidence',
        pass: anyViolation,
        hint: anyViolation ? '' : 'Photos were uploaded but no violation was detected. Review manually.',
      })
    }

    // Recalculate score from the final checklist (including photo checks)
    const passed = checks.filter(c => c.pass).length
    const score = checks.length ? Math.round((passed / checks.length) * 100) : 0

    let summary = analysis.summary || ''
    const uncovered = claimChecks.filter(c => !c.pass)
    if (uncovered.length > 0) {
      const names = uncovered.map(c => c.label.replace(/^Photo evidence:\s*/i, '')).join('; ')
      if (!/photo evidence/i.test(summary)) {
        summary = `${summary} Missing photo evidence for: ${names}.`.trim()
      }
    } else if (mentionsViolation && photos.length === 0) {
      summary = summary.replace(/\bno violations were identified\b/gi, 'a violation was identified')
      if (!/photo/i.test(summary)) {
        summary = `${summary} Supporting violation photos were not uploaded.`.trim()
      }
    }

    return NextResponse.json({
      ...analysis,
      score,
      summary,
      checks,
      claimedViolations,
      text: extractedText,
      documentName: savedDoc.fileName,
      documentPath: savedDoc.relativePath,
      documentData: docBuffer.toString('base64'),
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
