import { prisma } from '@/lib/prisma'

export const checklistRepository = {
  async findByReportId(reportId) {
    return prisma.checkItem.findMany({ where: { reportId }, orderBy: { id: 'asc' } })
  },
  async updatePass(id, pass) {
    return prisma.checkItem.update({ where: { id }, data: { pass } })
  }
}