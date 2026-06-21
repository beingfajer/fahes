import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function BackToReportsLink() {
  return (
    <Link href="/reports" className="back-link">
      <ArrowLeft size={15} /> Back to Reports
    </Link>
  )
}
