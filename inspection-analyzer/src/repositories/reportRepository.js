import { prisma } from '@/lib/prisma'

export const reportRepository = {
  async findAll() {
    return prisma.report.findMany({
      orderBy: { createdAt: 'desc' },
      include: { checks: true, photos: true },
    })
  },

  async findById(id) {
    return prisma.report.findUnique({
      where: { id },
      include: { checks: true, photos: true },
    })
  },

  async create({ text, documentName, documentPath, score, summary, checks, photos = [] }) {
    return prisma.report.create({
      data: {
        text,
        documentName,
        documentPath,
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
            detections: JSON.stringify(p.detections || []),
            summary: p.summary || '',
          })),
        },
      },
      include: { checks: true, photos: true },
    })
  },

  async delete(id) {
    return prisma.report.delete({ where: { id } })
  },
}
