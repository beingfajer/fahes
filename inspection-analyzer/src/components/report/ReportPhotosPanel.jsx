'use client'

import { useState } from 'react'
import { ImageOff } from 'lucide-react'

function PhotoImage({ photo }) {
  const [failed, setFailed] = useState(false)

  if (failed) {
    return (
      <div className="report-photos__missing">
        <ImageOff size={28} />
        <span>Photo file is no longer available</span>
      </div>
    )
  }

  return (
    <img
      src={`/api/photos/${photo.id}`}
      alt={photo.fileName}
      className="report-photos__image"
      onError={() => setFailed(true)}
    />
  )
}

export default function ReportPhotosPanel({ photos }) {
  if (!photos?.length) return null

  return (
    <div className="card report-photos">
      <div className="section-label">Violation Photos</div>
      <div className="report-photos__grid">
        {photos.map(photo => {
          let detections = []
          try {
            detections = JSON.parse(photo.detections || '[]')
          } catch {
            detections = []
          }

          return (
            <div key={photo.id} className="report-photos__item">
              <PhotoImage photo={photo} />
              <div className="report-photos__name">{photo.fileName}</div>
              <div className="report-photos__summary">{photo.summary}</div>
              {detections.length > 0 && (
                <ul className="report-photos__detections">
                  {detections.map((d, i) => (
                    <li key={i}>
                      {d.class}
                      {typeof d.confidence === 'number' ? ` (${Math.round(d.confidence * 100)}%)` : ''}
                    </li>
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
