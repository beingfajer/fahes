import { CheckCircle2, XCircle } from 'lucide-react'

export default function ReportCheckItem({ label, pass, hint }) {
  return (
    <div className="check-item">
      {pass ? (
        <CheckCircle2 size={16} className="check-item__icon check-item__icon--pass" />
      ) : (
        <XCircle size={16} className="check-item__icon check-item__icon--fail" />
      )}
      <div>
        <div className="check-item__label">{label}</div>
        {!pass && hint && <div className="check-item__hint">{hint}</div>}
      </div>
    </div>
  )
}
