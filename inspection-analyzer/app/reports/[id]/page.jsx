import { notFound } from 'next/navigation'
import { reportRepository } from '@/repositories/reportRepository'
import ReportDetailView from '@/components/report/ReportDetailView'

export const dynamic = 'force-dynamic'

export default async function ReportDetailPage({ params }) {
  const { id } = await params
  const report = await reportRepository.findById(id)
  if (!report) notFound()

  return <ReportDetailView report={report} />
}
