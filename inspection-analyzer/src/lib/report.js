export function reportMentionsViolation(reportText) {
  if (!reportText) return false

  const keywords = [
    'violation', 'hazard', 'blocked', 'missing', 'expired',
    'unsafe', 'damaged', 'improper', 'non-compliant', 'issue', 'problem',
  ]

  const lower = reportText.toLowerCase()
  return keywords.some(keyword => lower.includes(keyword))
}
