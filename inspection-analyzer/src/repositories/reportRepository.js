import { prisma } from '@/lib/prisma'

// File bytes are excluded from list/detail queries; they are served
// separately by the file routes to keep payloads small.
const withoutFileBytes = {
  omit: { documentData: true },
  include: {
    checks: true,
    photos: { omit: { data: true } },
  },
}

function buildDetections(photo) {
  if (photo.detections) return photo.detections
  const hasViolation = photo.hasViolation || (photo.violationClass && photo.violationClass !== 'no_violation')
  return hasViolation ? [{ class: photo.violationClass }] : []
}

export const reportRepository = {
  async findAll() {
    return prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      ...withoutFileBytes,
    })
  },

  async findById(id) {
    return prisma.report.findUnique({
      where: { id },
      ...withoutFileBytes,
    })
  },

  // Used by the structured export, which embeds photos into the generated docx
  async findByIdWithFiles(id) {
    return prisma.report.findUnique({
      where: { id },
      omit: { documentData: true },
      include: { checks: true, photos: true },
    })
  },

  async findDocumentById(id) {
    return prisma.report.findUnique({
      where: { id },
      select: { documentName: true, documentPath: true, documentData: true },
    })
  },

  async findPhotoById(id) {
    return prisma.photo.findUnique({
      where: { id },
      select: { fileName: true, filePath: true, data: true },
    })
  },

  async create({ text, documentName, documentPath, documentData, score, summary, checks, photos = [] }) {
    return prisma.report.create({
      data: {
        text,
        documentName,
        documentPath,
        documentData: documentData ? Buffer.from(documentData, 'base64') : null,
        score,
        summary,
        checks: {
          create: checks.map(c => ({
            label: c.label,
            pass: c.pass,
            hint: c.hint || '',
          })),
        },
        photos: {
          create: photos.map(p => ({
            fileName: p.fileName,
            filePath: p.filePath,
            data: p.data ? Buffer.from(p.data, 'base64') : null,
            detections: JSON.stringify(buildDetections(p)),
            summary: p.summary || '',
          })),
        },
      },
      ...withoutFileBytes,
    })
  },

  async delete(id) {
    return prisma.report.delete({ where: { id } })
  },
}
