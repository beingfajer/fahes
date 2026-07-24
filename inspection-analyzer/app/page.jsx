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

const HEADLINE = 'Catch incomplete reports before enforcement stalls'

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

const reveal = {
  initial: { opacity: 0, y: 36 },
  inView: { opacity: 1, y: 0 },
}

const revealTransition = { duration: 0.55, ease: [0.22, 1, 0.36, 1] }

function TypewriterTitle({ text, active }) {
  const [shown, setShown] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!active) {
      setShown('')
      setDone(false)
      return
    }

    let i = 0
    setShown('')
    setDone(false)
    const id = setInterval(() => {
      i += 1
      setShown(text.slice(0, i))
      if (i >= text.length) {
        clearInterval(id)
        setDone(true)
      }
    }, 28)
    return () => clearInterval(id)
  }, [text, active])

  return (
    <h1 className="landing__title">
      {shown}
      <span className={`landing__caret${done ? ' landing__caret--done' : ''}`} aria-hidden />
    </h1>
  )
}

function ReportMorph() {
  const [revealed, setRevealed] = useState(0)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!started) return
    if (revealed >= SAMPLE_CHECKS.length) return
    const t = setTimeout(() => setRevealed(r => r + 1), 480)
    return () => clearTimeout(t)
  }, [revealed, started])

  return (
    <motion.div
      className="morph"
      initial={reveal.initial}
      whileInView={reveal.inView}
      viewport={{ once: false, amount: 0.35 }}
      transition={revealTransition}
      onViewportEnter={() => {
        setStarted(true)
        setRevealed(0)
      }}
    >
      <div className="morph__panel morph__panel--raw">
        <div className="morph__label">01 · Raw notes</div>
        <p className="morph__scrawl">
          Visited the property on Monday. Found some problems.
          Owner was there. Will follow up.
        </p>
      </div>

      <div className="morph__divider" aria-hidden />

      <div className="morph__panel morph__panel--clean">
        <div className="morph__label">02 · Readout</div>
        <div className="morph__score">
          <span className="morph__score-num">{Math.round((revealed / SAMPLE_CHECKS.length) * 100)}</span>
          <span className="morph__score-unit">%</span>
          <span className="morph__score-text">coverage</span>
        </div>
        <ul className="morph__list">
          {SAMPLE_CHECKS.map((c, i) => (
            <li
              key={c}
              style={{ opacity: i < revealed ? 1 : 0.28 }}
            >
              {i < revealed ? <Check size={13} strokeWidth={2.5} className="morph__check" /> : <span className="morph__dot" />}
              {c}
            </li>
          ))}
        </ul>
      </div>
    </motion.div>
  )
}

function ReportsOpenLink() {
  const { openReports } = useReports()
  return (
    <button type="button" className="landing__cta-ghost" onClick={openReports}>
      View reports
    </button>
  )
}

export default function LandingPage() {
  const [heroInView, setHeroInView] = useState(true)

  return (
    <div className="landing">
      <div className="landing__grid" aria-hidden />

      <motion.section
        className="landing__hero"
        initial={reveal.initial}
        whileInView={reveal.inView}
        viewport={{ once: false, amount: 0.4 }}
        transition={revealTransition}
        onViewportEnter={() => setHeroInView(true)}
        onViewportLeave={() => setHeroInView(false)}
      >
        <div className="landing__hero-text">
          <p className="landing__brand">Fahes</p>
          <TypewriterTitle text={HEADLINE} active={heroInView} />
          <div className="landing__cta-row">
            <Link href="/submit" className="landing__cta">
              Run an assessment <ArrowRight size={15} strokeWidth={2.25} />
            </Link>
            <ReportsOpenLink />
          </div>
        </div>
      </motion.section>

      <motion.section
        className="landing__capabilities"
        initial={reveal.initial}
        whileInView={reveal.inView}
        viewport={{ once: false, amount: 0.25 }}
        transition={{ ...revealTransition, delay: 0.05 }}
      >
        <div className="landing__cap-head">
          <span className="landing__cap-kicker">What it does</span>
          <h2 className="landing__cap-title">Three moves. One standard.</h2>
        </div>

        <div className="landing__cap-row">
          <div className="landing__cap-list">
            {CAPABILITIES.map((c, i) => (
              <motion.div
                key={c.index}
                className="landing__cap-item"
                initial={reveal.initial}
                whileInView={reveal.inView}
                viewport={{ once: false, amount: 0.5 }}
                transition={{ ...revealTransition, delay: i * 0.06 }}
              >
                <span className="landing__cap-index">{c.index}</span>
                <div>
                  <h3>{c.title}</h3>
                  <p>{c.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <ReportMorph />
        </div>
      </motion.section>

      <footer className="landing__footer">
        <span>Fahes</span>
      </footer>

      <style>{`
        .landing {
          position: relative;
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
          mask-image: radial-gradient(ellipse 80% 55% at 50% 0%, black 15%, transparent 72%);
        }

        .landing__hero {
          position: relative;
          max-width: 1180px;
          margin: 0 auto;
          padding: 96px 40px 100px;
        }

        .landing__brand {
          font-family: 'Syne', sans-serif;
          font-size: clamp(56px, 9vw, 88px);
          font-weight: 800;
          letter-spacing: -0.05em;
          line-height: 0.92;
          color: var(--text);
          margin-bottom: 28px;
        }

        .landing__title {
          font-family: 'Syne', sans-serif;
          font-weight: 600;
          font-size: clamp(30px, 4.6vw, 48px);
          line-height: 1.18;
          color: var(--text);
          letter-spacing: -0.035em;
          margin-bottom: 36px;
          max-width: 18ch;
          min-height: 2.5em;
        }

        .landing__caret {
          display: inline-block;
          width: 2px;
          height: 0.85em;
          margin-left: 3px;
          vertical-align: -0.08em;
          background: var(--lab-accent);
          animation: landing-blink 0.9s step-end infinite;
        }

        .landing__caret--done {
          animation: landing-blink 1.1s step-end 4;
          animation-fill-mode: forwards;
        }

        @keyframes landing-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0; }
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
          transition: background 0.2s;
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

        .landing__capabilities {
          position: relative;
          max-width: 1180px;
          margin: 0 auto;
          padding: 0 40px 110px;
          padding-top: 64px;
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

        .landing__cap-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 420px);
          gap: 40px;
          align-items: start;
        }

        .landing__cap-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .landing__cap-item {
          display: flex;
          gap: 16px;
          padding: 14px 0;
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

        .morph {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 0;
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--btn-radius);
          overflow: hidden;
          position: sticky;
          top: 88px;
        }

        .morph__panel { padding: 22px 18px; }

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
          transition: opacity 0.25s;
        }

        .morph__check { color: var(--green); flex-shrink: 0; }
        .morph__dot {
          width: 5px; height: 5px;
          border-radius: 50%;
          background: var(--border);
          flex-shrink: 0;
          margin: 0 4px;
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

        @media (max-width: 960px) {
          .landing__hero {
            padding: 64px 24px 72px;
          }

          .landing__title {
            max-width: none;
            min-height: 3.2em;
          }

          .landing__capabilities {
            padding: 48px 24px 80px;
          }

          .landing__cap-row {
            grid-template-columns: 1fr;
            gap: 28px;
          }

          .morph {
            position: static;
            grid-template-columns: 1fr;
          }

          .morph__divider { width: 100%; height: 1px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .landing__caret { animation: none; opacity: 0; }
        }
      `}</style>
    </div>
  )
}
