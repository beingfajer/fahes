'use client'

import { useRef, useState } from 'react'
import { Brain, Save, RotateCcw, ChevronLeft } from 'lucide-react'
import { AnalysisContent } from '@/components/analysis/AnalysisPanel'

const WIZARD_STEPS = [
  { id: 1, label: 'Upload Document', subtitle: 'Upload your inspection report' },
  { id: 2, label: 'Upload Photos', subtitle: 'Add optional violation photos' },
  { id: 3, label: 'Analysis Results', subtitle: 'Review AI analysis' },
]

function StepperHorizontal({ currentStep }) {
  return (
    <div className="submission-wizard__stepper submission-wizard__stepper--horizontal">
      {WIZARD_STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = currentStep > stepNumber
        const isActive = currentStep === stepNumber

        return (
          <div key={step.id} className="submission-wizard__stepper-item">
            <div
              className={`submission-wizard__step${isActive ? ' submission-wizard__step--active' : ''}${isComplete ? ' submission-wizard__step--complete' : ''}`}
            >
              {stepNumber}
            </div>
            {index < WIZARD_STEPS.length - 1 && (
              <div className={`submission-wizard__step-line${isComplete ? ' submission-wizard__step-line--complete' : ''}`} />
            )}
          </div>
        )
      })}
    </div>
  )
}

function StepperSidebar({ currentStep }) {
  return (
    <ol className="submission-wizard__steps-list">
      {WIZARD_STEPS.map((step, index) => {
        const stepNumber = index + 1
        const isComplete = currentStep > stepNumber
        const isActive = currentStep === stepNumber

        return (
          <li
            key={step.id}
            className={`submission-wizard__steps-list-item${isActive ? ' submission-wizard__steps-list-item--active' : ''}${isComplete ? ' submission-wizard__steps-list-item--complete' : ''}`}
          >
            <span
              className={`submission-wizard__step${isActive ? ' submission-wizard__step--active' : ''}${isComplete ? ' submission-wizard__step--complete' : ''}`}
            >
              {stepNumber}
            </span>
            <div className="submission-wizard__steps-list-copy">
              <span className="submission-wizard__steps-list-label">{step.label}</span>
              <span className="submission-wizard__steps-list-desc">{step.subtitle}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

export default function SubmissionWizard({ onSave, saved, saving, saveError }) {
  const [step, setStep] = useState(1)
  const [document, setDocument] = useState(null)
  const [photos, setPhotos] = useState([])
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)

  const docInputRef = useRef(null)
  const photoInputRef = useRef(null)

  const currentMeta = WIZARD_STEPS[step - 1]

  async function handleAnalyze() {
    if (!document) return

    setStep(3)
    setAnalyzing(true)
    setError(null)
    setResult(null)

    try {
      const formData = new FormData()
      formData.append('document', document)
      photos.forEach(photo => formData.append('photos', photo))

      const res = await fetch('/api/analyze', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to analyze')
      setResult(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setAnalyzing(false)
    }
  }

  function handleClear() {
    setStep(1)
    setDocument(null)
    setPhotos([])
    setResult(null)
    setError(null)
    setAnalyzing(false)
    if (docInputRef.current) docInputRef.current.value = ''
    if (photoInputRef.current) photoInputRef.current.value = ''
  }

  return (
    <div className="submission-wizard">
      <div className="card submission-wizard__card">
        <div className="submission-wizard__top">
          <div className="submission-wizard__header">
            <h1 className="submission-wizard__title">Submit Inspection Report</h1>
            <p className="submission-wizard__meta">
              Step {step} of {WIZARD_STEPS.length}: {currentMeta.label}
            </p>
          </div>
          <StepperHorizontal currentStep={step} />
        </div>

        <div className="submission-wizard__layout">
          <aside className="submission-wizard__sidebar">
            <StepperSidebar currentStep={step} />
          </aside>

          <div className="submission-wizard__main">
            {step === 1 && (
              <>
                <h2 className="submission-wizard__step-title">Inspection Report Document</h2>
                <p className="submission-wizard__step-subtitle">{currentMeta.subtitle}</p>

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

                <div className="submission-wizard__actions submission-wizard__actions--end">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setStep(2)}
                    disabled={!document}
                  >
                    Next
                  </button>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="submission-wizard__step-title">Violation Photos</h2>
                <p className="submission-wizard__step-subtitle">{currentMeta.subtitle}</p>

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

                <div className="submission-wizard__actions submission-wizard__actions--split">
                  <button
                    type="button"
                    className="btn btn--outline"
                    onClick={() => setStep(1)}
                  >
                    <ChevronLeft size={16} /> Back
                  </button>
                  <button
                    type="button"
                    className="btn btn--primary submission-wizard__analyze-btn"
                    onClick={handleAnalyze}
                    disabled={analyzing || !document}
                  >
                    <Brain size={18} /> {analyzing ? 'Analyzing...' : 'Analyze Report'}
                  </button>
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <h2 className="submission-wizard__step-title">Analysis Results</h2>
                <p className="submission-wizard__step-subtitle">{currentMeta.subtitle}</p>

                <div className="submission-wizard__analysis">
                  <AnalysisContent
                    result={result}
                    error={error || saveError}
                    saved={saved}
                    analyzing={analyzing}
                  />
                </div>

                {!analyzing && (
                  <div className="submission-wizard__actions submission-wizard__actions--stack">
                    {result && (
                      <button
                        type="button"
                        className="btn btn--outline btn--block"
                        onClick={() => onSave(result)}
                        disabled={saving}
                      >
                        <Save size={16} /> {saving ? 'Saving...' : 'Save Report'}
                      </button>
                    )}
                    <button
                      type="button"
                      className="btn btn--outline btn--block"
                      onClick={handleClear}
                    >
                      <RotateCcw size={15} /> Clear & Start Over
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
