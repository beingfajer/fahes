import { Download } from 'lucide-react'

export default function ReportTextPanel({ reportId, text, documentName, createdAt, passedCount, totalCount }) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <div className="card">
      <div className="section-label">Report Document</div>

      {documentName && (
        <a
          href={`/api/reports/${reportId}/document`}
          className="report-document-link"
        >
          {documentName}
        </a>
      )}

      <div className="report-text__body">{text}</div>
      <div className="report-text__meta">
        {formattedDate} · {passedCount}/{totalCount} checks passed
      </div>

      <a
        href={`/api/reports/${reportId}/export`}
        className="btn btn--outline report-export-btn"
      >
        <Download size={16} /> Download Structured Report (.docx)
      </a>
    </div>
  )
}
