'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Trash2, ClipboardList } from 'lucide-react'
import { getScoreTier } from '@/lib/score'

function ScoreBadge({ score }) {
  const tier = getScoreTier(score)
  return <span className={`score-badge score-badge--${tier}`}>{score}%</span>
}

function StatusPill({ score }) {
  const tier = getScoreTier(score)
  const labels = { excellent: 'Complete', partial: 'Partial', incomplete: 'Incomplete' }
  return <span className={`status-pill status-pill--${tier}`}>● {labels[tier]}</span>
}

export default function ReportsTable({ initialReports }) {
  const [reports, setReports] = useState(initialReports)
  const [filter, setFilter] = useState('all')

  async function handleDelete(e, id) {
    e.preventDefault()
    e.stopPropagation()
    if (!confirm('Delete this report?')) return
    const res = await fetch(`/api/reports/${id}`, { method: 'DELETE' })
    if (!res.ok) {
      alert('Failed to delete report. Please try again.')
      return
    }
    setReports(r => r.filter(x => x.id !== id))
  }

  const filtered = reports.filter(r =>
    filter === 'all' ? true
      : filter === 'excellent' ? r.score >= 85
        : filter === 'partial' ? r.score >= 60 && r.score < 85
          : r.score < 60
  )

  const avg = reports.length ? Math.round(reports.reduce((s, r) => s + r.score, 0) / reports.length) : 0
  const avgTier = reports.length ? getScoreTier(avg) : 'neutral'

  const stats = [
    { label: 'Total Reports', value: reports.length, sub: 'All time', tier: 'neutral' },
    { label: 'Average Score', value: `${avg}%`, sub: 'Completeness', tier: avgTier },
    { label: 'Need Attention', value: reports.filter(r => r.score < 60).length, sub: 'Score below 60%', tier: 'incomplete' },
  ]

  const filters = [
    ['all', 'All'],
    ['excellent', '✓ Complete (≥85%)'],
    ['partial', '~ Partial (60–84%)'],
    ['incomplete', '✗ Incomplete (<60%)'],
  ]

  return (
    <>
      <div className="reports-stats">
        {stats.map(s => (
          <div key={s.label} className="card">
            <div className="reports-stat__label">{s.label}</div>
            <div className={`reports-stat__value stat-value--${s.tier}`}>{s.value}</div>
            <div className="reports-stat__sub">{s.sub}</div>
          </div>
        ))}
      </div>

      <div className="reports-filters">
        {filters.map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setFilter(key)}
            className={`btn btn--filter${filter === key ? ' btn--filter-active' : ''}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="reports-table">
        <div className="reports-table__head">
          <span>Report Preview</span>
          <span>Score</span>
          <span>Status</span>
          <span>Date</span>
          <span />
        </div>

        {filtered.length === 0 && (
          <div className="reports-table__empty">
            <ClipboardList size={36} className="reports-table__empty-icon" />
            <p className="reports-table__empty-text">No reports found</p>
          </div>
        )}

        <AnimatePresence>
          {filtered.map(r => (
            <motion.div key={r.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, height: 0 }}>
              <Link href={`/reports/${r.id}`} className="reports-table__row">
                <span className="reports-table__preview">
                  {r.documentName || `${r.text.slice(0, 80)}…`}
                </span>
                <ScoreBadge score={r.score} />
                <StatusPill score={r.score} />
                <span className="reports-table__date">
                  {new Date(r.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </span>
                <button type="button" onClick={e => handleDelete(e, r.id)} className="btn btn--icon">
                  <Trash2 size={15} />
                </button>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  )
}
