import { NextResponse } from 'next/server'
import { readFile } from 'fs/promises'
import { reportRepository } from '@/repositories/reportRepository'
import { extractReportFields } from '@/lib/ai'
import { buildStructuredReportDocx } from '@/lib/exportDocx'
import { resolveUploadPath } from '@/lib/storage'

export const maxDuration = 60

// Best-effort extraction used when the AI provider is unavailable
function extractFieldsWithRegex(text) {
  const grab = re => {
    const match = text.match(re)
    return match ? match[1].trim() : null
  }

  return {
    referenceNumber: grab(/reference(?:\s*(?:no|number|#))?\s*[:\-]\s*([A-Z]{2,}[-/][\w-]+)/i),
    inspectionDate: grab(/date\s*[:\-]?\s*([A-Za-z]+\s+\d{1,2},?\s+\d{4}|\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4})/i),
    inspectionTime: grab(/time\s*[:\-]?\s*(\d{1,2}:\d{2}\s*(?:[AP]\.?M\.?)?)/i),
    location: grab(/location\s*[:\-]\s*(.+?)(?=\s*(?:violation code|severity|reference|date|time)\s*[:\-]|\n|$)/i),
    inspectorName: grab(/inspector(?:'s)?(?:\s+name)?\s*[:\-]\s*(.+?)(?=\n|$)/i),
    violationCode: grab(/violation code\s*[:\-]?\s*([A-Z]{2,}[-\w]*(?:\s*\([^)]*\))?)/i),
    severity: grab(/severity\s*[:\-]?\s*(low|medium|high|critical)/i),
    ownerContact: null,
    correctiveActions: null,
    followUp: null,
  }
}

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const report = await reportRepository.findByIdWithFiles(id)
    if (!report) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 })
    }

    // Legacy photos only have a disk path; load the bytes so they can be embedded
    for (const photo of report.photos) {
      if (!photo.data && photo.filePath) {
        try {
          photo.data = await readFile(resolveUploadPath(photo.filePath))
        } catch {
          photo.data = null
        }
      }
    }

    let fields
    try {
      fields = await extractReportFields(report.text)
    } catch (err) {
      console.error('AI field extraction failed, falling back to regex:', err)
      fields = extractFieldsWithRegex(report.text)
    }

    const buffer = await buildStructuredReportDocx(report, fields)
    const baseName = (fields?.referenceNumber || `report-${report.id}`).replace(/[^\w-]+/g, '-')

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(`structured-inspection-${baseName}.docx`)}`,
      },
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Failed to generate structured report' }, { status: 500 })
  }
}
