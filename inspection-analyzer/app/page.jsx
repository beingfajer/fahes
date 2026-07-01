'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ClipboardCheck, FileText, Camera, BarChart3, ArrowRight, Check } from 'lucide-react'

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
    const t = setTimeout(() => setRevealed(r => r + 1), 500)
    return () => clearTimeout(t)
  }, [revealed])

  return (
    <div className="morph">
      <div className="morph__panel morph__panel--raw">
        <div className="morph__label">Before</div>
        <p className="morph__scrawl">
          Visited the property on Monday. Found some problems.
          Owner was there. Will follow up.
        </p>
      </div>

      <div className="morph__arrow">
        <ArrowRight size={20} />
      </div>

      <div className="morph__panel morph__panel--clean">
        <div className="morph__label">After</div>
        <div className="morph__score">
          <span className="morph__score-num">{Math.round((revealed / SAMPLE_CHECKS.length) * 100)}%</span>
          <span className="morph__score-text">complete</span>
        </div>
        <ul className="morph__list">
          {SAMPLE_CHECKS.map((c, i) => (
            <motion.li
              key={c}
              initial={{ opacity: 0, x: -6 }}
              animate={{ opacity: i < revealed ? 1 : 0.25, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              {i < revealed ? <Check size={14} className="morph__check" /> : <span className="morph__dot" />}
              {c}
            </motion.li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const FEATURES = [
  {
    icon: FileText,
    title: 'Upload any report',
    body: 'PDF or Word — no new forms to learn. Inspectors keep writing reports the way they always have.',
  },
  {
    icon: BarChart3,
    title: 'Instant completeness score',
    body: 'AI checks the report against an 9-point standard and tells you exactly what is missing.',
  },
  {
    icon: Camera,
    title: 'Photo violation detection',
    body: 'Upload site photos and let AI detect violations.',
  },
]

export default function LandingPage() {
  return (
    <div className="landing">
      <section className="landing__hero">
        <div className="landing__hero-text">
          <p className="landing__eyebrow">Qatar Tourism Authority</p>
          <h1 className="landing__title">
            A report should tell you<br />what's wrong <em>and</em> what's missing.
          </h1>
          <p className="landing__subtitle">
            Upload an inspection report and let AI catch incomplete documentation
            before it slows down enforcement, or worse, escalates unnecessarily to court.
          </p>
          <Link href="/submit" className="landing__cta">
            Analyze a report <ArrowRight size={16} />
          </Link>
        </div>

        <ReportMorph />
      </section>

      <section className="landing__features">
        {FEATURES.map(f => (
          <div key={f.title} className="landing__feature">
            <f.icon size={22} className="landing__feature-icon" />
            <h3>{f.title}</h3>
            <p>{f.body}</p>
          </div>
        ))}
      </section>

      <footer className="landing__footer">
        Qatar Tourism Authority
      </footer>

      <style>{`
        .landing { min-height: 100vh; background: var(--bg); }

        .landing__nav {
          display: flex; align-items: center; justify-content: space-between;
          padding: 20px 48px; max-width: 1100px; margin: 0 auto;
        }
        .landing__brand { display: flex; align-items: center; gap: 10px; font-family: 'Syne', sans-serif; font-weight: 600; font-size: 15px; color: var(--p950); }
        .landing__brand-icon { width: 32px; height: 32px; background: var(--p400); border-radius: 9px; display: flex; align-items: center; justify-content: center; color: white; }
        .landing__nav-cta { font-size: 13.5px; font-weight: 500; color: var(--p700); padding: 8px 16px; border-radius: 8px; border: 1.5px solid var(--p300); transition: background 0.2s; }
        .landing__nav-cta:hover { background: var(--p50); }

        .landing__hero {
          max-width: 1100px; margin: 0 auto; padding: 64px 48px 80px;
          display: grid; grid-template-columns: 1fr 1fr; gap: 56px; align-items: center;
        }
        .landing__eyebrow { font-size: 12.5px; font-weight: 500; letter-spacing: 0.6px; color: var(--p600); text-transform: uppercase; margin-bottom: 18px; }
        .landing__title {
          font-family: 'Syne', sans-serif; font-weight: 600; font-size: 38px; line-height: 1.18;
          color: var(--text); letter-spacing: -0.7px; margin-bottom: 20px;
        }
        .landing__title em { font-style: normal; color: var(--p500); }
        .landing__subtitle { font-size: 16px; line-height: 1.6; color: var(--text2); max-width: 440px; margin-bottom: 32px; }
        .landing__cta {
          display: inline-flex; align-items: center; gap: 8px;
          background: var(--p500); color: white; font-size: 15px; font-weight: 500;
          padding: 13px 24px; border-radius: 10px; transition: background 0.2s;
        }
        .landing__cta:hover { background: var(--p600); }

        .morph {
          display: flex; align-items: stretch; gap: 14px;
          background: var(--surface); border-radius: 16px; border: 1px solid var(--border2);
          padding: 24px; box-shadow: 0 1px 4px rgba(0,0,0,0.05);
        }
        .morph__panel { flex: 1; display: flex; flex-direction: column; }
        .morph__label { font-size: 10.5px; font-weight: 500; letter-spacing: 0.7px; text-transform: uppercase; color: var(--text3); margin-bottom: 10px; }
        .morph__panel--raw .morph__scrawl {
          font-family: 'DM Sans', sans-serif; font-style: italic; font-size: 12.5px; line-height: 1.6;
          color: var(--text3); background: var(--surface2); border-radius: 10px; padding: 14px;
          border: 1px dashed var(--border);
        }
        .morph__arrow { display: flex; align-items: center; color: var(--p400); flex-shrink: 0; }
        .morph__score { display: flex; align-items: baseline; gap: 6px; margin-bottom: 12px; }
        .morph__score-num { font-family: 'Syne', sans-serif; font-size: 26px; font-weight: 700; color: var(--p600); }
        .morph__score-text { font-size: 12px; color: var(--text3); }
        .morph__list { display: flex; flex-direction: column; gap: 8px; }
        .morph__list li { display: flex; align-items: center; gap: 8px; font-size: 12px; color: var(--text2); list-style: none; }
        .morph__check { color: var(--green); flex-shrink: 0; }
        .morph__dot { width: 6px; height: 6px; border-radius: 50%; background: var(--border); flex-shrink: 0; margin: 0 4px; }

        .landing__features {
          max-width: 1100px; margin: 0 auto; padding: 0 48px 80px;
          display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px;
        }
        .landing__feature {
          background: var(--surface); border: 1px solid var(--border2); border-radius: 14px;
          padding: 24px;
        }
        .landing__feature-icon { color: var(--p500); margin-bottom: 14px; }
        .landing__feature h3 { font-family: 'Syne', sans-serif; font-size: 15px; font-weight: 600; color: var(--text); margin-bottom: 8px; }
        .landing__feature p { font-size: 13.5px; line-height: 1.55; color: var(--text2); }

        .landing__footer { text-align: center; padding: 28px; font-size: 12px; color: var(--text3); }

        @media (max-width: 860px) {
          .landing__hero { grid-template-columns: 1fr; }
          .landing__features { grid-template-columns: 1fr; }
          .landing__title { font-size: 30px; }
        }
      `}</style>
    </div>
  )
}
