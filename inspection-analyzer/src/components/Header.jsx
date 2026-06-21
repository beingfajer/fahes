'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ClipboardCheck } from 'lucide-react'
import ThemeToggle from '@/components/ThemeToggle'

const NAV_ITEMS = [
  { href: '/submit', label: 'New Report' },
  { href: '/reports', label: 'All Reports' },
]

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="site-header">
      <div className="site-header__brand">
        <div className="site-header__logo">
          <ClipboardCheck size={18} color="white" />
        </div>
        <div>
          <div className="site-header__title">Fahes</div>
          <div className="site-header__subtitle">AI-Powered Inspection Report Analysis</div>
        </div>
      </div>

      <div className="site-header__actions">
        <nav className="site-header__nav">
          {NAV_ITEMS.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className={`site-header__nav-link${pathname === href ? ' site-header__nav-link--active' : ''}`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <ThemeToggle />

        <div className="site-header__badge">
          <span className="site-header__badge-dot" />
          AI Powered
        </div>
      </div>
    </header>
  )
}
