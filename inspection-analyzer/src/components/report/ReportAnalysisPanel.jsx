import ReportScoreRing from './ReportScoreRing'
import ReportCheckItem from './ReportCheckItem'

export default function ReportAnalysisPanel({ score, summary, checks }) {
  const passedCount = checks.filter(c => c.pass).length

  return (
    <div className="card">
      <div className="section-label">Analysis Results</div>

      <ReportScoreRing score={score} passedCount={passedCount} totalCount={checks.length} />

      <div className="summary-box summary-box--plain">{summary}</div>

      <div className="checklist-heading">Required fields</div>

      {checks.map(check => (
        <ReportCheckItem
          key={check.id}
          label={check.label}
          pass={check.pass}
          hint={check.hint}
        />
      ))}
    </div>
  )
}
