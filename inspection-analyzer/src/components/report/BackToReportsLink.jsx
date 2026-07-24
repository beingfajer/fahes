'use client'

import { ArrowLeft } from 'lucide-react'
import { useReports } from '@/components/reports/ReportsProvider'

export default function BackToReportsLink() {
  const { openReports } = useReports()

  return (
    <button type="button" className="back-link" onClick={openReports}>
      <ArrowLeft size={15} /> All reports
    </button>
  )
}
