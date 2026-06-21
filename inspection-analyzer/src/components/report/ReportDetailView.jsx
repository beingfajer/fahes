import BackToReportsLink from './BackToReportsLink'
import ReportTextPanel from './ReportTextPanel'
import ReportAnalysisPanel from './ReportAnalysisPanel'
import ReportPhotosPanel from './ReportPhotosPanel'

export default function ReportDetailView({ report }) {
  const passedCount = report.checks.filter(c => c.pass).length

  return (
    <div>
      <BackToReportsLink />

      <div className="two-column-grid">
        <div className="report-detail__left">
          <ReportTextPanel
            text={report.text}
            documentName={report.documentName}
            documentPath={report.documentPath}
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
