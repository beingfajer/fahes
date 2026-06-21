import Link from 'next/link'
import { reportRepository } from '@/repositories/reportRepository'
import ReportsTable from '@/components/dashboard/ReportsTable'

export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const reports = await reportRepository.findAll()

  return (
    <>
      <div className="page-header">
        <div>
          <div className="page-header__title">Inspection Reports</div>
          <div className="page-header__subtitle">All submitted and analyzed reports</div>
        </div>
        <Link href="/submit" className="btn btn--cta">
          + New Report
        </Link>
      </div>
      <ReportsTable initialReports={reports} />
    </>
  )
}
