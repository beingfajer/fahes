import { getScoreTier, getScoreRingOffset } from '@/lib/score'

const LABELS = {
  excellent: 'Excellent',
  partial: 'Needs Improvement',
  incomplete: 'Incomplete',
}

export default function ReportScoreRing({ score, passedCount, totalCount }) {
  const tier = getScoreTier(score)

  return (
    <div className="score-ring" style={{ '--ring-offset': getScoreRingOffset(score) }}>
      <div className="score-ring__chart">
        <svg className="score-ring__svg" width="72" height="72" viewBox="0 0 72 72">
          <circle className="score-ring__track" cx="36" cy="36" r="30" />
          <circle className={`score-ring__progress score-ring__progress--${tier}`} cx="36" cy="36" r="30" />
        </svg>
        <div className={`score-ring__value score-ring__value--${tier}`}>{score}%</div>
      </div>
      <div>
        <div className="score-ring__title">{LABELS[tier]} Report</div>
        <div className="score-ring__subtitle">
          {passedCount} of {totalCount} fields complete
        </div>
      </div>
    </div>
  )
}
