'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { X } from 'lucide-react'
import { useReports } from '@/components/reports/ReportsProvider'
import { getScoreTier } from '@/lib/score'

function previewText(report) {
  const raw = report.text || report.documentName || 'Untitled report'
  const trimmed = raw.replace(/\s+/g, ' ').trim()
  return trimmed.length > 72 ? `${trimmed.slice(0, 72)}...` : trimmed
}

function formatDate(value) {
  if (!value) return ''
  try {
    return new Date(value).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })
  } catch {
    return ''
  }
}

export default function ReportsSidebar() {
  const { open, closeReports } = useReports()
  const pathname = usePathname()
  const [reports, setReports] = useState([])
  const [status, setStatus] = useState('idle')

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setStatus('loading')
    fetch('/api/reports')
      .then(async res => {
        if (!res.ok) throw new Error('Failed to fetch')
        return res.json()
      })
      .then(data => {
        if (cancelled) return
        setReports(Array.isArray(data) ? data : [])
        setStatus('ready')
      })
      .catch(() => {
        if (cancelled) return
        setReports([])
        setStatus('error')
      })
    return () => {
      cancelled = true
    }
  }, [open])

  useEffect(() => {
    if (open) closeReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname])

  return (
    <>
      <button
        type="button"
        className={`reports-overlay${open ? ' reports-overlay--open' : ''}`}
        aria-label="Close reports"
        tabIndex={open ? 0 : -1}
        onClick={closeReports}
      />

      <aside
        id="reports-sidebar"
        className={`reports-sidebar${open ? ' reports-sidebar--open' : ''}`}
        aria-hidden={!open}
        aria-label="Reports"
      >
        <div className="reports-sidebar__head">
          <div>
            <div className="reports-sidebar__title">Reports</div>
            <div className="reports-sidebar__subtitle">Assessed inspections</div>
          </div>
          <button
            type="button"
            className="reports-sidebar__close"
            onClick={closeReports}
            aria-label="Close reports"
          >
            <X size={16} />
          </button>
        </div>

        <div className="reports-sidebar__body">
          {status === 'loading' && (
            <p className="reports-sidebar__empty">Loading reports...</p>
          )}

          {status === 'error' && (
            <p className="reports-sidebar__empty">
              Could not load reports. Check your database connection and try again.
            </p>
          )}

          {status === 'ready' && reports.length === 0 && (
            <p className="reports-sidebar__empty">No reports yet.</p>
          )}

          {status === 'ready' && reports.length > 0 && (
            <ul className="reports-sidebar__list">
              {reports.map(report => {
                const tier = getScoreTier(report.score)
                const active = pathname === `/reports/${report.id}`
                return (
                  <li key={report.id}>
                    <Link
                      href={`/reports/${report.id}`}
                      className={`reports-sidebar__item${active ? ' reports-sidebar__item--active' : ''}`}
                      onClick={closeReports}
                    >
                      <div className="reports-sidebar__item-main">
                        <span className="reports-sidebar__item-preview">
                          {previewText(report)}
                        </span>
                        <span className="reports-sidebar__item-date">
                          {formatDate(report.createdAt)}
                        </span>
                      </div>
                      <span className={`score-badge score-badge--${tier}`}>
                        {report.score}%
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </aside>
    </>
  )
}
