'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SubmissionForm from '@/components/submission/SubmissionForm'
import AnalysisPanel from '@/components/analysis/AnalysisPanel'

export default function SubmitPage() {
  const router = useRouter()
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  function handleResult(data, err, isAnalyzing = false) {
    setAnalyzing(isAnalyzing)
    setSaved(false)
    setResult(data)
    setError(err)
  }

  async function handleSave(analysisResult) {
    setSaving(true)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: analysisResult.text,
          documentName: analysisResult.documentName,
          documentPath: analysisResult.documentPath,
          score: analysisResult.score,
          summary: analysisResult.summary,
          checks: analysisResult.checks,
          photos: analysisResult.photos || [],
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      setTimeout(() => router.push('/reports'), 1500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="two-column-grid">
      <SubmissionForm
        onResult={handleResult}
        onSave={handleSave}
        analyzing={analyzing}
        saving={saving}
        result={result}
      />
      <AnalysisPanel result={result} error={error} saved={saved} />
    </div>
  )
}
