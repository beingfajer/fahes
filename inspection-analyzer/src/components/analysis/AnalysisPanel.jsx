'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, CheckCircle2, XCircle, ChevronDown, Camera, AlertTriangle } from 'lucide-react'
import { getScoreTier, getScoreRingOffset } from '@/lib/score'

function ScoreRing({ score }) {
  const tier = getScoreTier(score)
  const labels = {
    excellent: ['Excellent Report', 'This report meets all required standards.'],
    partial: ['Needs Improvement', 'Some key details are missing.'],
    incomplete: ['Incomplete Report', 'Critical information is missing. Please revise.'],
  }
  const [title, desc] = labels[tier]

  return (
    <div className="score-ring" style={{ '--ring-offset': getScoreRingOffset(score) }}>
      <div className="score-ring__chart">
        <svg className="score-ring__svg" width="72" height="72" viewBox="0 0 72 72">
          <circle className="score-ring__track" cx="36" cy="36" r="30" />
          <motion.circle
            className={`score-ring__progress score-ring__progress--${tier}`}
            cx="36"
            cy="36"
            r="30"
            initial={{ strokeDashoffset: 188 }}
            animate={{ strokeDashoffset: getScoreRingOffset(score) }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
          />
        </svg>
        <div className={`score-ring__value score-ring__value--${tier}`}>{score}%</div>
      </div>
      <div>
        <div className="score-ring__title">{title}</div>
        <div className="score-ring__subtitle">{desc}</div>
      </div>
    </div>
  )
}

function CheckItem({ item }) {
  const [open, setOpen] = useState(false)

  return (
    <div
      className={`check-item${item.pass ? '' : ' check-item--clickable'}`}
      onClick={() => !item.pass && setOpen(o => !o)}
    >
      {item.pass ? (
        <CheckCircle2 size={16} className="check-item__icon check-item__icon--pass" />
      ) : (
        <XCircle size={16} className="check-item__icon check-item__icon--fail" />
      )}
      <div className="check-item__body">
        <div className="check-item__label">{item.label}</div>
        <AnimatePresence>
          {(open || item.pass) && (
            <motion.div
              className="check-item__hint"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
            >
              {item.pass ? 'This field is present and complete.' : item.hint}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {!item.pass && (
        <ChevronDown
          size={14}
          className={`check-item__chevron${open ? ' check-item__chevron--open' : ''}`}
        />
      )}
    </div>
  )
}

function ConfidenceBadge({ confidence }) {
  const pct = Math.round(confidence * 100)
  const bg = pct >= 80 ? '#FEE2E2' : pct >= 50 ? '#FEF3C7' : '#F0F4F6'
  const color = pct >= 80 ? '#991B1B' : pct >= 50 ? '#92400E' : '#4A6070'
  return (
    <span style={{
      fontSize: 11, fontWeight: 600, padding: '2px 8px',
      borderRadius: 20, background: bg, color, flexShrink: 0
    }}>
      {pct}%
    </span>
  )
}

function PhotoAnalysis({ photos }) {
  if (!photos?.length) return null

  const allDetections = photos.flatMap(p =>
    (p.detections || []).map(d => ({ ...d, fileName: p.fileName, photoSource: p.source }))
  )
  const hasDetections = allDetections.length > 0

  return (
    <div className="photo-analysis" style={{ marginTop: 20 }}>
      <div className="checklist-heading" style={{ marginBottom: 10 }}>
        <Camera size={12} /> Photo Analysis
      </div>

      {/* Per-photo summary */}
      {photos.map((photo, i) => (
        <div key={i} style={{
          padding: '10px 12px', borderRadius: 9, marginBottom: 6,
          border: '1px solid var(--border2)', background: 'var(--surface)',
        }}>
          <div style={{ fontWeight: 500, marginBottom: 4, color: 'var(--text)', fontSize: 12 }}>
            {photo.source && (
              <span style={{
                marginLeft: 8, fontSize: 10, padding: '1px 7px',
                borderRadius: 20, background: photo.source === 'azure' ? '#EDE9FE' : '#DBEAFE',
                color: photo.source === 'azure' ? '#5B21B6' : '#1E40AF', fontWeight: 600
              }}>
                {photo.source === 'azure' ? 'GPT-4o Vision' : 'Roboflow'}
              </span>
            )}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{photo.summary}</div>
        </div>
      ))}

      {/* Violations detected section */}
      <div style={{ marginTop: 14 }}>
        <div className="checklist-heading" style={{ marginBottom: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
          <AlertTriangle size={12} />
          Violations Detected
          <span style={{
            fontSize: 11, padding: '1px 8px', borderRadius: 20,
            background: hasDetections ? '#FEE2E2' : '#D1FAE5',
            color: hasDetections ? '#991B1B' : '#065F46',
            fontWeight: 600
          }}>
            {allDetections.length} found
          </span>
        </div>

        {!hasDetections && (
          <div style={{
            padding: '10px 12px', borderRadius: 9,
            border: '1px solid var(--border2)',
            background: '#F0FDF4', fontSize: 13, color: '#166534',
            display: 'flex', alignItems: 'center', gap: 8
          }}>
            <CheckCircle2 size={14} color="#166534" />
            No violations detected in uploaded photos
          </div>
        )}

        {allDetections.map((d, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{
              padding: '12px 14px', borderRadius: 9, marginBottom: 8,
              border: '1px solid #FECACA', background: '#FEF2F2',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="#E24B4A" style={{ flexShrink: 0 }} />
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                  {d.class
                    .replace(/_/g, ' ')
                    .replace(/\b\w/g, c => c.toUpperCase())
                    .replace(/\bAi\b/g, 'AI')}
                </div>
              </div>
              <ConfidenceBadge confidence={d.confidence} />
            </div>
            {d.description && (
              <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginLeft: 22 }}>
                {d.description}
              </div>
            )}
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, marginLeft: 22 }}>
              from {d.fileName}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

export default function AnalysisPanel({ result, error, saved }) {
  if (!result && !error) {
    return (
      <div className="card">
        <div className="section-label"><Sparkles size={14} /> Analysis Results</div>
        <div className="analysis-panel__empty">
          <Sparkles size={44} className="analysis-panel__empty-icon" />
          <p className="analysis-panel__empty-text">
            Upload a report document to see AI analysis and optional photo CV results
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="card">
      <div className="section-label"><Sparkles size={14} /> Analysis Results</div>

      {error && <div className="alert alert--error">Error: {error}</div>}
      {saved && <div className="alert alert--success"> Report saved to dashboard.</div>}

      {result && (
        <motion.div className="analysis-panel__content" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
          <ScoreRing score={result.score} />
          <div className="summary-box">{result.summary}</div>
          <div className="checklist-heading">Required fields</div>
          {result.checks.map((c, i) => <CheckItem key={i} item={c} />)}
          <PhotoAnalysis photos={result.photos} />
        </motion.div>
      )}
    </div>
  )
}