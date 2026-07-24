'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import BackToReportsLink from './BackToReportsLink'
import ReportTextPanel from './ReportTextPanel'
import ReportAnalysisPanel from './ReportAnalysisPanel'
import ReportPhotosPanel from './ReportPhotosPanel'

export default function ReportDetailView({ report }) {
  const router = useRouter()
  const passedCount = report.checks.filter(c => c.pass).length
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [error, setError] = useState(null)

  async function handleDelete() {
    if (!confirming) {
      setConfirming(true)
      setError(null)
      return
    }

    setDeleting(true)
    setError(null)
    try {
      const res = await fetch(`/api/reports/${report.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Failed to delete report')
      router.push('/')
      router.refresh()
    } catch (e) {
      setError(e.message || 'Failed to delete report')
      setDeleting(false)
      setConfirming(false)
    }
  }

  return (
    <div>
      <div className="report-detail__toolbar">
        <BackToReportsLink />
        <div className="report-detail__toolbar-actions">
          {error && <span className="report-detail__delete-error">{error}</span>}
          <button
            type="button"
            className={`btn btn--outline report-detail__delete${confirming ? ' report-detail__delete--confirm' : ''}`}
            onClick={handleDelete}
            disabled={deleting}
          >
            <Trash2 size={15} />
            {deleting ? 'Removing...' : confirming ? 'Confirm remove' : 'Remove report'}
          </button>
          {confirming && !deleting && (
            <button
              type="button"
              className="btn btn--outline"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="two-column-grid">
        <div className="report-detail__left">
          <ReportTextPanel
            reportId={report.id}
            text={report.text}
            documentName={report.documentName}
            createdAt={report.createdAt}
            passedCount={passedCount}
            totalCount={report.checks.length}
          />
          <ReportPhotosPanel photos={report.photos} />
        </div>
        <ReportAnalysisPanel
          score={report.score}
          summary={report.summary}
          checks={report.checks}
        />
      </div>
    </div>
  )
}
