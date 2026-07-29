import {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  ImageRun,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} from 'docx'

export const TEMPLATE_FIELDS = [
  { label: 'Reference Number', key: 'referenceNumber' },
  { label: 'Date of Inspection', key: 'inspectionDate' },
  { label: 'Time of Inspection', key: 'inspectionTime' },
  { label: 'Location', key: 'location' },
  { label: 'Inspector / Reporter', key: 'inspectorName' },
  { label: 'Violation Code', key: 'violationCode' },
  { label: 'Severity Level', key: 'severity' },
  { label: 'Owner / Contact', key: 'ownerContact' },
  { label: 'Corrective Actions', key: 'correctiveActions' },
  { label: 'Follow-up Inspection', key: 'followUp' },
]

const MISSING_COLOR = 'C0392B'
const ACCENT_COLOR = '1B7A8C'
const FAHES_GREEN = '1E8E3E'
const CELL_BORDER = { style: BorderStyle.SINGLE, size: 4, color: 'CCD5DB' }
const CELL_BORDERS = { top: CELL_BORDER, bottom: CELL_BORDER, left: CELL_BORDER, right: CELL_BORDER }

function labelCell(text) {
  return new TableCell({
    width: { size: 32, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    shading: { fill: 'F0F4F6' },
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [new TextRun({ text, bold: true, size: 20 })] })],
  })
}

function valueCell(value) {
  const run = value
    ? new TextRun({ text: value, size: 20 })
    : new TextRun({ text: 'MISSING', bold: true, color: MISSING_COLOR, size: 20 })

  return new TableCell({
    width: { size: 68, type: WidthType.PERCENTAGE },
    borders: CELL_BORDERS,
    margins: { top: 80, bottom: 80, left: 120, right: 120 },
    children: [new Paragraph({ children: [run] })],
  })
}

function sectionHeading(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, color: ACCENT_COLOR, size: 24 })],
  })
}

// Reads width/height from PNG or JPEG headers so embedded photos keep
// their aspect ratio without pulling in an image library.
function getImageSize(buffer) {
  if (buffer.length > 24 && buffer.readUInt32BE(0) === 0x89504e47) {
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) }
  }
  if (buffer.length > 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < buffer.length) {
      if (buffer[offset] !== 0xff) {
        offset += 1
        continue
      }
      const marker = buffer[offset + 1]
      const isSof = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)
      if (isSof) {
        return { height: buffer.readUInt16BE(offset + 5), width: buffer.readUInt16BE(offset + 7) }
      }
      offset += 2 + buffer.readUInt16BE(offset + 2)
    }
  }
  return null
}

function photoImageType(fileName = '') {
  if (/\.png$/i.test(fileName)) return 'png'
  return 'jpg'
}

function buildPhotoBlocks(photos) {
  if (!photos?.length) {
    return [
      new Paragraph({
        spacing: { after: 120 },
        children: [
          new TextRun({ text: 'Violation photo evidence: ', size: 20 }),
          new TextRun({ text: 'MISSING', bold: true, color: MISSING_COLOR, size: 20 }),
        ],
      }),
    ]
  }

  const blocks = []
  for (const photo of photos) {
    blocks.push(
      new Paragraph({
        spacing: { before: 160, after: 60 },
        children: [new TextRun({ text: photo.fileName, bold: true, size: 20 })],
      })
    )

    const buffer = photo.data ? Buffer.from(photo.data) : null
    if (buffer) {
      try {
        const size = getImageSize(buffer)
        const maxWidth = 420
        const width = size ? Math.min(size.width, maxWidth) : maxWidth
        const height = size ? Math.round(size.height * (width / size.width)) : 315
        blocks.push(
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new ImageRun({
                type: photoImageType(photo.fileName),
                data: buffer,
                transformation: { width, height },
              }),
            ],
          })
        )
      } catch {
        // Skip the embedded image if it cannot be decoded; the summary below still applies.
      }
    }

    if (photo.summary) {
      blocks.push(
        new Paragraph({
          spacing: { after: 120 },
          children: [new TextRun({ text: photo.summary, italics: true, size: 18, color: '55636B' })],
        })
      )
    }
  }
  return blocks
}

function buildChecklistTable(checks) {
  const rows = [
    new TableRow({
      children: [
        labelCell('Required Field'),
        new TableCell({
          borders: CELL_BORDERS,
          shading: { fill: 'F0F4F6' },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          children: [new Paragraph({ children: [new TextRun({ text: 'Status', bold: true, size: 20 })] })],
        }),
      ],
    }),
    ...checks.map(check =>
      new TableRow({
        children: [
          new TableCell({
            width: { size: 60, type: WidthType.PERCENTAGE },
            borders: CELL_BORDERS,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [new Paragraph({ children: [new TextRun({ text: check.label, size: 20 })] })],
          }),
          new TableCell({
            width: { size: 40, type: WidthType.PERCENTAGE },
            borders: CELL_BORDERS,
            margins: { top: 80, bottom: 80, left: 120, right: 120 },
            children: [
              new Paragraph({
                children: [
                  check.pass
                    ? new TextRun({ text: 'Complete', bold: true, color: '1E8E3E', size: 20 })
                    : new TextRun({ text: 'MISSING', bold: true, color: MISSING_COLOR, size: 20 }),
                ],
              }),
            ],
          }),
        ],
      })
    ),
  ]

  return new Table({ width: { size: 100, type: WidthType.PERCENTAGE }, rows })
}

export async function buildStructuredReportDocx(report, fields) {
  const generatedOn = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  const fieldTable = new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: TEMPLATE_FIELDS.map(({ label, key }) => {
      const value = typeof fields?.[key] === 'string' ? fields[key].trim() : fields?.[key]
      return new TableRow({ children: [labelCell(label), valueCell(value || null)] })
    }),
  })

  const narrative = (report.text || '')
    .split(/\n+/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line =>
      new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: line, size: 20 })],
      })
    )

  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({ text: '✓  Checked by FAHES', bold: true, size: 28, color: FAHES_GREEN }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 40 },
            children: [new TextRun({ text: 'Structured Inspection Report', size: 24 })],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 240 },
            children: [
              new TextRun({ text: `Generated on ${generatedOn} · Report ID ${report.id}`, size: 16, color: '55636B' }),
            ],
          }),

          sectionHeading('Report Details'),
          fieldTable,

          sectionHeading('Inspection Narrative'),
          ...narrative,

          sectionHeading('Photo Evidence'),
          ...buildPhotoBlocks(report.photos),

          sectionHeading('Quality Analysis'),
          new Paragraph({
            spacing: { after: 120 },
            children: [
              new TextRun({ text: `Completeness score: ${report.score}%`, bold: true, size: 20 }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [new TextRun({ text: report.summary || '', size: 20 })],
          }),
          buildChecklistTable(report.checks || []),
        ],
      },
    ],
  })

  return Packer.toBuffer(doc)
}
