'use client'

import { useRef, useState } from 'react'
import { Brain, Save, RotateCcw, FileText, ImagePlus } from 'lucide-react'

export default function SubmissionForm({ onResult, onSave, analyzing, saving, result }) {
  const [document, setDocument] = useState(null)
  const [photos, setPhotos] = useState([])
  const docInputRef = useRef(null)
  const photoInputRef = useRef(null)

  async function handleAnalyze() {
    if (!document) return

    onResult(null, null, true)

    try {
      const formData = new FormData()
      formData.append('document', document)
      photos.forEach(photo => formData.append('photos', photo))

      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to analyze')
      onResult(data, null, false)
    } catch (e) {
      onResult(null, e.message, false)
    }
  }

  function handleClear() {
    setDocument(null)
    setPhotos([])
    if (docInputRef.current) docInputRef.current.value = ''
    if (photoInputRef.current) photoInputRef.current.value = ''
    onResult(null, null, false)
  }

  return (
    <div className="card">
      <div className="section-label"><FileText size={14} /> Inspection Report Document</div>

      <label className="upload-zone">
        <input
          ref={docInputRef}
          type="file"
          accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
          className="upload-zone__input"
          onChange={e => setDocument(e.target.files?.[0] || null)}
        />
        {document ? (
          <span className="upload-zone__label">{document.name}</span>
        ) : (
          <span className="upload-zone__label">Upload PDF or Word (.docx)</span>
        )}
      </label>

      <div className="section-label upload-section-label">
        <ImagePlus size={14} /> Violation Photos <span className="upload-optional">(optional)</span>
      </div>

      <label className="upload-zone upload-zone--photos">
        <input
          ref={photoInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="upload-zone__input"
          onChange={e => setPhotos(Array.from(e.target.files || []))}
        />
        {photos.length > 0 ? (
          <span className="upload-zone__label">{photos.length} photo(s) selected</span>
        ) : (
          <span className="upload-zone__label">Upload violation photos (JPG, PNG)</span>
        )}
      </label>

      {photos.length > 0 && (
        <ul className="upload-photo-list">
          {photos.map(p => (
            <li key={p.name + p.size}>{p.name}</li>
          ))}
        </ul>
      )}

      <div className="submission-form__actions">
        <button
          type="button"
          className="btn btn--primary"
          onClick={handleAnalyze}
          disabled={analyzing || !document}
        >
          <Brain size={18} /> {analyzing ? 'Analyzing...' : 'Analyze Report'}
        </button>

        {result && (
          <button
            type="button"
            className="btn btn--success"
            onClick={() => onSave(result)}
            disabled={saving}
          >
            <Save size={16} /> {saving ? 'Saving...' : 'Save Report to Dashboard'}
          </button>
        )}

        {(document || photos.length > 0 || result) && (
          <button type="button" className="btn btn--ghost" onClick={handleClear}>
            <RotateCcw size={15} /> Clear & Start Over
          </button>
        )}
      </div>
    </div>
  )
}
