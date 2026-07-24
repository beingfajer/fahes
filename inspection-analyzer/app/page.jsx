'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Check } from 'lucide-react'
import { useReports } from '@/components/reports/ReportsProvider'

const SAMPLE_CHECKS = [
  'Date & time recorded',
  'Location specified',
  'Violation code referenced',
  'Severity level assessed',
  'Owner / contact present',
]

function ReportMorph() {
  const [revealed, setRevealed] = useState(0)

  useEffect(() => {
    if (revealed >= SAMPLE_CHECKS.length) return
    const t = setTimeout(() => setRevealed(r => r + 1), 480)
    return () => clearTimeout(t)
  }, [revealed])

  return (
    <div className="morph">
      <div className="morph__panel morph__panel--raw">
        <div className="morph__label">01 · Raw notes</div>
        <p className="morph__scrawl">
          Visited the property on Monday. Found some problems.
          Owner was there. Will follow up.
        </p>
      </div>

      <motion.div
        className="morph__divider"
        initial={{ scaleY: 0 }}
        animate={{ scaleY: 1 }}
        transition={{ duration: 0.5, delay: 0.15 }}
        aria-hidden
      />

      <div className="morph__panel morph__panel--clean">
        <div className="morph__label">02 · Readout</div>
        <div className="morph__score">
          <span className="morph__score-num">{Math.round((revealed / SAMPLE_CHECKS.length) * 100)}</span>
          <span className="morph__score-unit">%</span>
          <span className="morph__score-text">coverage</span>
        </div>
        <ul className="morph__list">
          {SAMPLE_CHECKS.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: i < revealed ? 1 : 0.28, y: 0 }}
              transition={{ duration: 0.28 }}
            >
              {i < revealed ? <Check size={13} strokeWidth={2.5} className="morph__check" /> : <span className="morph__dot" />}
              {c}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const CAPABILITIES = [
  {
    index: '01',
    title: 'Document intake',
    body: 'PDF or Word. Inspectors keep writing reports the way they always have.',
  },
  {
    index: '02',
    title: 'Completeness scoring',
    body: 'Nine-point standard. Instant readout of what is present and what is missing.',
  },
  {
    index: '03',
    title: 'Photo signals',
    body: 'Optional site photos. Surface visual cues that belong in the written record.',
  },
]

function ReportsOpenLink() {
  const { openReports } = useReports()
  return (
    <button type="button" className="landing__cta-ghost" onClick={openReports}>
      View reports
    </button>
  )
}

export default function LandingPage() {
  return (
    <div className="landing">
      <div className="landing__grid" aria-hidden />

      <section className="landing__hero">
        <motion.div
          className="landing__hero-text"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="landing__brand">Fahes</p>
          <p className="landing__meta">Qatar Tourism Authority</p>
          <h1 className="landing__title">
            Catch incomplete reports<br />before enforcement stalls.
          </h1>
          <div className="landing__cta-row">
            <Link href="/submit" className="landing__cta">
              Run an assessment <ArrowRight size={15} strokeWidth={2.25} />
            </Link>
            <ReportsOpenLink />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
        >
          <ReportMorph />
        </motion.div>
      </section>

      <section className="landing__capabilities">
        <div className="landing__cap-head">
          <span className="landing__cap-kicker">What it does</span>
          <h2 className="landing__cap-title">Three moves. One standard.</h2>
        </div>
        <div className="landing__cap-list">
          {CAPABILITIES.map((c, i) => (
            <motion.div
              key={c.index}
              className="landing__cap-item"
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-40px' }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
            >
              <span className="landing__cap-index">{c.index}</span>
              <div>
                <h3>{c.title}</h3>
                <p>{c.body}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      <footer className="landing__footer">
        <span>Fahes</span>
        <span className="landing__footer-sep" />
        <span>Qatar Tourism Authority</span>
      </footer>

      <style>{`
        .landing {
          position: relative;
          min-height: calc(100vh - 56px);
          overflow: hidden;
          background: var(--bg);
        }

        .landing__grid {
          pointer-events: none;
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(var(--grid-line) 1px, transparent 1px),
            linear-gradient(90deg, var(--grid-line) 1px, transparent 1px);
          background-size: 48px 48px;
          mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 20%, transparent 75%);
        }

        .landing__hero {
          position: relative;
          max-width: 1120px;
          margin: 0 auto;
          padding: 72px 40px 88px;
          display: grid;
          grid-template-columns: 1.05fr 0.95fr;
          gap: 56px;
          align-items: center;
        }

        .landing__brand {
          font-family: 'Syne', sans-serif;
          font-size: clamp(48px, 7vw, 72px);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 0.92;
          color: var(--text);
          margin-bottom: 14px;
        }

        .landing__meta {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text3);
          margin-bottom: 28px;
        }

        .landing__title {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: clamp(22px, 2.6vw, 28px);
          line-height: 1.25;
          color: var(--text);
          letter-spacing: -0.03em;
          margin-bottom: 16px;
        }

        .landing__subtitle {
          font-size: 15.5px;
          line-height: 1.65;
          color: var(--text2);
          max-width: 420px;
          margin-bottom: 32px;
        }

        .landing__cta-row {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 16px;
        }

        .landing__cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--p500);
          color: white;
          font-size: 14px;
          font-weight: 500;
          padding: 12px 20px;
          border-radius: var(--btn-radius);
          transition: background 0.2s, transform 0.2s;
        }

        .landing__cta:hover { background: var(--p600); }

        .landing__cta-ghost {
          font-size: 14px;
          font-weight: 500;
          color: var(--text2);
          border: none;
          border-bottom: 1px solid var(--border);
          border-radius: 0;
          background: none;
          padding: 0 0 2px;
          cursor: pointer;
          font-family: inherit;
          transition: color 0.15s, border-color 0.15s;
        }

        .landing__cta-ghost:hover {
          color: var(--text);
          border-bottom-color: var(--lab-accent);
        }

        .morph {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          overflow: hidden;
        }

        .morph__panel { padding: 22px 20px; }

        .morph__label {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          font-weight: 500;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          color: var(--text3);
          margin-bottom: 12px;
        }

        .morph__panel--raw .morph__scrawl {
          font-style: italic;
          font-size: 13px;
          line-height: 1.65;
          color: var(--text3);
          background: var(--surface2);
          padding: 14px;
          border-left: 2px solid var(--border);
        }

        .morph__divider {
          width: 1px;
          background: var(--border);
          transform-origin: top;
          align-self: stretch;
        }

        .morph__score {
          display: flex;
          align-items: baseline;
          gap: 2px;
          margin-bottom: 14px;
        }

        .morph__score-num {
          font-family: 'Syne', sans-serif;
          font-size: 36px;
          font-weight: 700;
          letter-spacing: -0.04em;
          color: var(--lab-accent);
          line-height: 1;
        }

        .morph__score-unit {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--lab-accent);
          margin-right: 8px;
        }

        .morph__score-text {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--text3);
        }

        .morph__list {
          display: flex;
          flex-direction: column;
          gap: 9px;
        }

        .morph__list li {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12.5px;
          color: var(--text2);
          list-style: none;
        }

        .morph__check { color: var(--green); flex-shrink: 0; }
        .morph__dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--border);
          flex-shrink: 0;
          margin: 0 4px;
        }

        .landing__capabilities {
          position: relative;
          max-width: 1120px;
          margin: 0 auto;
          padding: 0 40px 96px;
          border-top: 1px solid var(--border);
          padding-top: 56px;
        }

        .landing__cap-head { margin-bottom: 36px; }

        .landing__cap-kicker {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          color: var(--text3);
          display: block;
          margin-bottom: 10px;
        }

        .landing__cap-title {
          font-family: 'Syne', sans-serif;
          font-size: 24px;
          font-weight: 600;
          letter-spacing: -0.03em;
          color: var(--text);
        }

        .landing__cap-list {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 0;
          border-top: 1px solid var(--border);
        }

        .landing__cap-item {
          display: flex;
          gap: 16px;
          padding: 28px 24px 28px 0;
          border-right: 1px solid var(--border);
          padding-right: 28px;
          margin-right: 28px;
        }

        .landing__cap-item:last-child {
          border-right: none;
          margin-right: 0;
          padding-right: 0;
        }

        .landing__cap-index {
          font-family: 'IBM Plex Mono', monospace;
          font-size: 12px;
          font-weight: 500;
          color: var(--lab-accent);
          flex-shrink: 0;
          padding-top: 3px;
        }

        .landing__cap-item h3 {
          font-family: 'Syne', sans-serif;
          font-size: 16px;
          font-weight: 600;
          color: var(--text);
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .landing__cap-item p {
          font-size: 13.5px;
          line-height: 1.55;
          color: var(--text2);
        }

        .landing__footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 28px 24px 40px;
          font-family: 'IBM Plex Mono', monospace;
          font-size: 11px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--text3);
        }

        .landing__footer-sep {
          width: 4px;
          height: 4px;
          background: var(--border);
          border-radius: 50%;
        }

        @media (max-width: 900px) {
          .landing__hero {
            grid-template-columns: 1fr;
            padding: 48px 24px 64px;
            gap: 40px;
          }
          .landing__capabilities { padding: 48px 24px 72px; }
          .landing__cap-list { grid-template-columns: 1fr; }
          .landing__cap-item {
            border-right: none;
            margin-right: 0;
            padding-right: 0;
            border-bottom: 1px solid var(--border);
            padding-bottom: 24px;
            margin-bottom: 8px;
          }
          .landing__cap-item:last-child { border-bottom: none; }
          .morph { grid-template-columns: 1fr; }
          .morph__divider { width: 100%; height: 1px; }
        }
      `}</style>
    </div>
  )
}
