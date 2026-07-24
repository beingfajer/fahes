'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

const ReportsContext = createContext(null)

export function ReportsProvider({ children }) {
  const [open, setOpen] = useState(false)

  const toggle = useCallback(() => setOpen(v => !v), [])
  const openReports = useCallback(() => setOpen(true), [])
  const closeReports = useCallback(() => setOpen(false), [])

  useEffect(() => {
    if (!open) return
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  const value = useMemo(
    () => ({ open, toggle, openReports, closeReports }),
    [open, toggle, openReports, closeReports],
  )

  return (
    <ReportsContext.Provider value={value}>
      {children}
    </ReportsContext.Provider>
  )
}

export function useReports() {
  const ctx = useContext(ReportsContext)
  if (!ctx) throw new Error('useReports must be used within ReportsProvider')
  return ctx
}
