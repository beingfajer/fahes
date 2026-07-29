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

/**
 * Known claim types that can be matched to photo violation classes.
 * Patterns look for affirmative problems; clearPatterns suppress false hits
 * like "first aid kits were fully stocked".
 */
export const VIOLATION_CLAIM_TYPES = [
  {
    id: 'missing_fire_equipment',
    label: 'Missing fire extinguisher / fire equipment',
    classNames: ['missing_fire_equipment'],
    clearPatterns: [
      /fire\s*extinguish\w*[^.?]{0,40}\b(is present|are present|in place|properly installed)\b/i,
    ],
    patterns: [
      /fire\s*extinguish\w*[^.?]{0,80}\b(missing|absent|empty|not found|unavailable|removed)\b/i,
      /\b(missing|absent|empty|not found|unavailable|removed)\b[^.?]{0,80}fire\s*(extinguish\w*|safety equipment|equipment)\b/i,
      /fire\s+safety\s+equipment[^.?]{0,40}\b(missing|absent|empty)\b/i,
      /\b(wall|mounting)\s+bracket was empty\b/i,
      /\bno\s+(alternative\s+)?(fire\s*)?extinguish/i,
    ],
  },
  {
    id: 'missing_first_aid',
    label: 'Missing or empty first aid kit',
    classNames: ['missing_first_aid'],
    clearPatterns: [
      /first[-\s]?aid[^.?]{0,50}\b(fully stocked|stocked|complete|adequately equipped|contents (are )?present)\b/i,
      /\b(fully stocked|stocked|complete)\b[^.?]{0,40}first[-\s]?aid/i,
    ],
    patterns: [
      /first[-\s]?aid[^.?]{0,70}\b(empty|missing|absent|unstocked|inadequate|no contents|not stocked)\b/i,
      /\b(empty|missing|absent|unstocked|inadequate)\b[^.?]{0,50}first[-\s]?aid/i,
      /empty first aid kit/i,
    ],
  },
  {
    id: 'fire_exit_blocked',
    label: 'Blocked fire exit',
    classNames: ['fire_exit_blocked'],
    clearPatterns: [
      /fire\s+exits?[^.?]{0,40}\b(clear|unobstructed|accessible)\b/i,
    ],
    patterns: [
      /fire\s+exit\w*[^.?]{0,50}\b(blocked|obstructed|inaccessible)\b/i,
      /\b(blocked|obstructed)\b[^.?]{0,40}fire\s+exit/i,
    ],
  },
  {
    id: 'food_safety_violation',
    label: 'Food safety violation',
    classNames: ['food_safety_violation'],
    clearPatterns: [
      /food storage[^.?]{0,50}\b(properly|correct|compliant)\b/i,
    ],
    patterns: [
      /\b(improper|unsafe)\s+food\b/i,
      /uncovered food/i,
      /food[^.?]{0,40}(temperature|storage)[^.?]{0,40}(wrong|improper|unsafe|incorrect)/i,
      /raw meat[^.?]{0,40}(stored|left|improper)/i,
    ],
  },
  {
    id: 'hygiene_violation',
    label: 'Hygiene / sanitation violation',
    classNames: ['hygiene_violation'],
    clearPatterns: [],
    patterns: [
      /\bhygiene violation\b/i,
      /\b(stained|soiled)\s+(linens?|sheets?|towels?)\b/i,
      /\bmold\b/i,
      /\bunsanitary\b/i,
      /\bpoor sanitation\b/i,
    ],
  },
  {
    id: 'electrical_hazard',
    label: 'Electrical hazard',
    classNames: ['electrical_hazard'],
    clearPatterns: [],
    patterns: [
      /exposed wir(e|ing)/i,
      /electrical hazard/i,
      /unsafe electrical/i,
    ],
  },
  {
    id: 'missing_signage',
    label: 'Missing required signage',
    classNames: ['missing_signage'],
    clearPatterns: [],
    patterns: [
      /missing[^.?]{0,40}signage/i,
      /required signs?[^.?]{0,30}(absent|missing)/i,
    ],
  },
  {
    id: 'improper_storage',
    label: 'Improper storage',
    classNames: ['improper_storage'],
    clearPatterns: [],
    patterns: [
      /improper storage/i,
      /stored incorrectly/i,
      /chemicals[^.?]{0,40}(stored|near)\b[^.?]{0,40}(guest|food|supply)/i,
    ],
  },
]

/**
 * Extract specific violation claims from report text for photo-evidence matching.
 */
export function extractClaimedViolations(reportText) {
  if (!reportText) return []

  const text = reportText.replace(/\s+/g, ' ')
  const claims = []

  for (const type of VIOLATION_CLAIM_TYPES) {
    if (type.clearPatterns.some(re => re.test(text))) continue
    if (type.patterns.some(re => re.test(text))) {
      claims.push({
        id: type.id,
        label: type.label,
        classNames: type.classNames,
      })
    }
  }

  // If no specific claims matched but the report clearly finds a violation,
  // keep a generic claim so photo evidence is still required.
  if (!claims.length && reportMentionsViolation(reportText)) {
    claims.push({
      id: 'safety_hazard',
      label: 'Reported safety / hygiene violation',
      classNames: ['safety_hazard', 'hygiene_violation', 'missing_fire_equipment', 'missing_first_aid', 'food_safety_violation', 'improper_storage', 'electrical_hazard', 'fire_exit_blocked', 'missing_signage'],
    })
  }

  return claims
}

/**
 * Merge heuristic + AI claims by id (AI labels win when both exist).
 */
export function mergeClaimedViolations(...lists) {
  const byId = new Map()
  for (const list of lists) {
    for (const claim of list || []) {
      if (!claim?.id) continue
      const existing = byId.get(claim.id)
      byId.set(claim.id, {
        id: claim.id,
        label: claim.label || existing?.label || claim.id.replace(/_/g, ' '),
        classNames: Array.from(new Set([
          ...(existing?.classNames || []),
          ...(claim.classNames || [claim.id]),
        ])),
      })
    }
  }
  // Drop the generic fallback if we have specific claims
  if (byId.size > 1 && byId.has('safety_hazard')) {
    const onlyGeneric = [...byId.values()].every(c => c.id === 'safety_hazard')
    if (!onlyGeneric) byId.delete('safety_hazard')
  }
  return Array.from(byId.values())
}

/**
 * Infer violation classes present in analyzed photos (class + summary cues).
 */
export function detectPhotoViolationClasses(photos = []) {
  const detected = new Set()

  for (const photo of photos) {
    const hasViolation = photo.hasViolation || (photo.violationClass && photo.violationClass !== 'no_violation')
    if (!hasViolation) continue

    if (photo.violationClass && photo.violationClass !== 'no_violation') {
      detected.add(photo.violationClass)
    }

    const summary = (photo.summary || '').toLowerCase()
    if (/first aid/.test(summary) && /(empty|missing|absent|unstocked|no contents|no supplies|inadequate)/.test(summary)) {
      detected.add('missing_first_aid')
    }
    if (
      /(extinguish|fire equipment|fire safety|water sign|mounting bracket|wall bracket|no extinguisher)/.test(summary)
      && /(missing|absent|empty|not present|unavailable|removed|bracket)/.test(summary)
    ) {
      detected.add('missing_fire_equipment')
    }
    if (/fire exit/.test(summary) && /(blocked|obstruct)/.test(summary)) {
      detected.add('fire_exit_blocked')
    }
    if (/(hygiene|mold|stained|unsanitary|sanitation)/.test(summary)) {
      detected.add('hygiene_violation')
    }
    if (/(food|raw meat|temperature)/.test(summary) && /(improper|unsafe|uncovered|wrong)/.test(summary)) {
      detected.add('food_safety_violation')
    }
  }

  return detected
}

/**
 * Match each claimed violation to photo evidence.
 * Returns checklist-ready items: { label, pass, hint, claimId, covered }
 */
export function buildClaimPhotoChecks(claims, photos = []) {
  if (!claims.length) return []

  if (!photos.length) {
    return claims.map(claim => ({
      label: `Photo evidence: ${claim.label}`,
      pass: false,
      hint: `The report claims "${claim.label}", but no supporting photo was uploaded.`,
      claimId: claim.id,
      covered: false,
    }))
  }

  const detected = detectPhotoViolationClasses(photos)

  return claims.map(claim => {
    const covered = (claim.classNames || [claim.id]).some(c => detected.has(c))
    return {
      label: `Photo evidence: ${claim.label}`,
      pass: covered,
      hint: covered
        ? ''
        : `The report claims "${claim.label}", but none of the uploaded photos show this issue.`,
      claimId: claim.id,
      covered,
    }
  })
}
