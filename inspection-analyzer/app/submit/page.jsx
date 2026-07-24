'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import SubmissionWizard from '@/components/submission/SubmissionWizard'

export default function SubmitPage() {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)

  async function handleSave(analysisResult) {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: analysisResult.text,
          documentName: analysisResult.documentName,
          documentPath: analysisResult.documentPath,
          documentData: analysisResult.documentData,
          score: analysisResult.score,
          summary: analysisResult.summary,
          checks: analysisResult.checks,
          photos: analysisResult.photos || [],
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      const report = await res.json()
      setSaved(true)
      setTimeout(() => router.push(`/reports/${report.id}`), 1500)
    } catch (e) {
      setError(e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <SubmissionWizard
      onSave={handleSave}
      saving={saving}
      saved={saved}
      saveError={error}
    />
  )
}
