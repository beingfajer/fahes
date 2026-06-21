export default function ReportTextPanel({ text, documentName, documentPath, createdAt, passedCount, totalCount }) {
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

      {documentName && documentPath && (
        <a
          href={`/api/files/${documentPath.split('/').map(encodeURIComponent).join('/')}`}
          target="_blank"
          rel="noopener noreferrer"
          className="report-document-link"
        >
          {documentName}
        </a>
      )}

      <div className="report-text__body">{text}</div>
      <div className="report-text__meta">
        {formattedDate} · {passedCount}/{totalCount} checks passed
      </div>
    </div>
  )
}
