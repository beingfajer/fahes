'use client'

import Header from '@/components/Header'
import { ReportsProvider } from '@/components/reports/ReportsProvider'
import ReportsSidebar from '@/components/reports/ReportsSidebar'

export default function AppShell({ children }) {
  return (
    <ReportsProvider>
      <Header />
      <main className="app-main">{children}</main>
      <ReportsSidebar />
    </ReportsProvider>
  )
}
