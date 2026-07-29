/**
 * Returns true only when the report indicates a violation/issue was actually found.
 * Mentions like "no violations", "Violation Code: None", etc. return false.
 */
export function reportMentionsViolation(reportText) {
  if (!reportText) return false

  const lower = reportText.toLowerCase().replace(/\s+/g, ' ')

  // Explicit statements that nothing wrong was found
  const clearPatterns = [
    /\bno\s+violations?\b/,
    /\bwithout\s+(any\s+)?violations?\b/,
    /\bviolation\s+code\s*[:\-]?\s*(none|n\/a|na|nil|not\s+applicable|-)\b/,
    /\bseverity\s*[:\-]?\s*(none|n\/a|na|nil|not\s+applicable|-)\b/,
    /\bno\s+(safety\s+|hygiene\s+)?(issues?|problems?|hazards?)\s+(were\s+|was\s+)?(found|observed|identified|detected|noted)\b/,
    /\b(found|observed|identified|detected|noted)\s+no\s+(violations?|issues?|problems?|hazards?)\b/,
    /\bdid\s+not\s+(find|observe|identify|detect|note)\s+(any\s+)?(violations?|issues?|problems?|hazards?)\b/,
    /\bno\s+evidence\s+of\s+(a\s+)?(violations?|non[- ]compliance)\b/,
    /\b(found|observed|identified)\s+to\s+be\s+(fully\s+)?compliant\b/,
    /\b(all\s+areas|premises|facility|inspection)\s+(was|were|are)\s+(found\s+to\s+be\s+)?(clear|compliant|fully compliant)\b/,
    /\bcompliant\s+with\b/,
    /\bfully\s+compliant\b/,
    /\bpassed\s+(the\s+)?inspection\b/,
    /\bno\s+non[- ]compliance\b/,
    /\bcompliance\s+certificate\s+(issued|granted)\b/,
  ]
  if (clearPatterns.some(re => re.test(lower))) return false

  // Affirmative finding that a violation / issue exists
  const foundPatterns = [
    /\b(found|identified|observed|detected|noted|discovered)\b(?![\s\S]{0,24}\b(no|not|none|compliant)\b)[\s\S]{0,48}\b(violations?|hazards?|issues?|problems?|deficienc(?:y|ies)|non[- ]compliance)\b/,
    /\bthere\s+(was|were)\b[\s\S]{0,40}\b(violations?|hazards?|issues?|problems?|deficienc(?:y|ies))\b/,
    /\b(violations?|hazards?|issues?|problems?)\s+(was|were|have\s+been|has\s+been)\s+(found|identified|observed|detected|noted|discovered)\b/,
    /\bin\s+violation\s+of\b/,
    /\bcommitted\s+(a\s+)?violations?\b/,
    // Real violation code values only (not None / N/A)
    /\bviolation\s+code\s*[:\-]?\s*(?!none\b|n\/a\b|na\b|nil\b|not\s+applicable\b|-\s)([a-z]{2,}[\w-]*)/i,
    /\bseverity\s*[:\-]?\s*(low|medium|high|critical)\b/,
    /\bcorrective\s+actions?\s+(required|needed|include|must)\b/,
  ]
  return foundPatterns.some(re => re.test(lower))
}
