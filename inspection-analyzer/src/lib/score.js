export function getScoreTier(score) {
  if (score >= 85) return 'excellent'
  if (score >= 60) return 'partial'
  return 'incomplete'
}

export function getScoreRingOffset(score) {
  return 188 - (score / 100) * 188
}
