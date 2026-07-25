'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import ThemeToggle from '@/components/ThemeToggle'
import { useReports } from '@/components/reports/ReportsProvider'

export default function Header() {
  const pathname = usePathname()
  const { open, toggle } = useReports()
  const newReportActive = pathname === '/submit' || pathname.startsWith('/submit/')

  return (
    <header className="site-header">
      <Link href="/" className="site-header__brand">
        <span className="site-header__mark">Fahes</span>
      </Link>

      <div className="site-header__actions">
        <nav className="site-header__nav" aria-label="Primary">
          <Link
            href="/submit"
            className={`site-header__nav-link${newReportActive ? ' site-header__nav-link--active' : ''}`}
          >
            <span className="site-header__nav-full">New report</span>
            <span className="site-header__nav-short">New</span>
          </Link>
          <button
            type="button"
            className={`site-header__nav-link${open ? ' site-header__nav-link--active' : ''}`}
            onClick={toggle}
            aria-expanded={open}
            aria-controls="reports-sidebar"
          >
            Reports
          </button>
        </nav>
        <ThemeToggle />
      </div>
    </header>
  )
}
