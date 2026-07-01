'use client'

import { useState, useEffect } from 'react'
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

function isViolatingPhoto(photo) {
  if (photo.hasViolation) return true
  return Boolean(photo.violationClass && photo.violationClass !== 'no_violation')
}

function PhotoAnalysis({ photos }) {
  if (!photos?.length) return null

  const violatingPhotos = photos.filter(isViolatingPhoto)
  const hasDetections = violatingPhotos.length > 0

  return (
    <div className="photo-analysis" style={{ marginTop: 20 }}>
      <div className="checklist-heading" style={{ marginBottom: 10 }}>
        <Camera size={12} /> Photo Analysis
      </div>

      {/* Per-photo summary
      {photos.map((photo, i) => (
        <div key={i} style={{
          padding: '10px 12px', borderRadius: 9, marginBottom: 6,
          border: '1px solid var(--border2)', background: 'var(--surface)',
        }}>
          <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>{photo.fileName}</div>
          <div style={{ fontSize: 12, color: 'var(--text2)' }}>{photo.summary}</div>
        </div>
      ))} */}

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
            {violatingPhotos.length} found
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

        {violatingPhotos.map((photo, i) => (
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <AlertTriangle size={14} color="#E24B4A" style={{ flexShrink: 0 }} />
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                {(photo.violationClass || 'violation')
                  .replace(/_/g, ' ')
                  .replace(/\b\w/g, c => c.toUpperCase())}
              </div>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.5, marginLeft: 22 }}>
              {photo.summary}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5, marginLeft: 22 }}>
              from {photo.fileName}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}

const STEPS = [
  'Extracting text from document...',
  'Reading report content...',
  'Checking required fields...',
  'Scoring completeness...',
  'Analyzing violation photos...',
  'Almost there...',
]

function LoadingSteps() {
  const [step, setStep] = useState(0)

  useEffect(() => {
    const t = setInterval(() => {
      setStep(s => (s + 1) % STEPS.length)
    }, 1800)
    return () => clearInterval(t)
  }, [])

  return (
    <div style={{ textAlign: 'center' }}>
      <AnimatePresence mode="wait">
        <motion.p
          key={step}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.3 }}
          style={{ fontSize: 14, color: 'var(--text2)', margin: 0 }}
        >
          {STEPS[step]}
        </motion.p>
      </AnimatePresence>
      <p style={{ fontSize: 12, color: 'var(--text3)', marginTop: 8 }}>
        This usually takes 5–15 seconds
      </p>
    </div>
  )
}

export default function AnalysisPanel({ result, error, saved, analyzing }) {
  if (analyzing) {
    return (
      <div className="card">
        <div className="section-label"><Sparkles size={14} /> Analysis Results</div>
        <div className="analysis-panel__empty">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20, padding: '24px 0' }}>

            {/* Animated ring */}
            <div style={{ position: 'relative', width: 72, height: 72 }}>
              <svg width="72" height="72" viewBox="0 0 72 72" style={{ transform: 'rotate(-90deg)' }}>
                <circle fill="none" stroke="var(--p100)" strokeWidth="6" cx="36" cy="36" r="30" />
                <motion.circle
                  fill="none" stroke="var(--p400)" strokeWidth="6" strokeLinecap="round"
                  cx="36" cy="36" r="30"
                  strokeDasharray="188"
                  animate={{ strokeDashoffset: [188, 40, 188] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Sparkles size={18} color="var(--p500)" />
              </div>
            </div>

            {/* Cycling status messages */}
            <LoadingSteps hasPhotos={false} />
          </div>
        </div>
      </div>
    )
  }

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
      {saved && <div className="alert alert--success">Report saved to dashboard.</div>}

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
