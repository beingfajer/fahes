export default function ReportPhotosPanel({ photos }) {
  if (!photos?.length) return null

  return (
    <div className="card report-photos">
      <div className="section-label">Violation Photos</div>
      <div className="report-photos__grid">
        {photos.map(photo => {
          const detections = JSON.parse(photo.detections || '[]')
          const fileUrl = `/api/files/${photo.filePath.split('/').map(encodeURIComponent).join('/')}`

          return (
            <div key={photo.id} className="report-photos__item">
              <img src={fileUrl} alt={photo.fileName} className="report-photos__image" />
              <div className="report-photos__name">{photo.fileName}</div>
              <div className="report-photos__summary">{photo.summary}</div>
              {detections.length > 0 && (
                <ul className="report-photos__detections">
                  {detections.map((d, i) => (
                    <li key={i}>{d.class} — {Math.round(d.confidence * 100)}%</li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
