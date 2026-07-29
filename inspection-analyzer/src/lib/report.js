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
    classNames: ['food_safety_violation', 'improper_storage', 'hygiene_violation'],
    clearPatterns: [
      /food storage[^.?]{0,50}\b(properly|correct|compliant)\b/i,
    ],
    patterns: [
      /\b(improper|unsafe)\s+food\b/i,
      /improper food storage/i,
      /uncovered (food|raw meat|meat)/i,
      /food[^.?]{0,40}(temperature|storage)[^.?]{0,40}(wrong|improper|unsafe|incorrect)/i,
      /raw meat[^.?]{0,40}(stored|left|improper|uncovered|hygiene)/i,
      /hygiene[^.?]{0,60}(uncovered|raw meat|food storage)/i,
    ],
  },
  {
    id: 'hygiene_violation',
    label: 'Hygiene / sanitation violation',
    classNames: ['hygiene_violation'],
    // Skip when "hygiene" is just describing a food/meat issue (one photo = one claim)
    clearPatterns: [
      /hygiene[^.?]{0,80}\b(food|meat|storage|uncovered|temperature|refriger|freezer)\b/i,
      /\b(food|meat|storage|uncovered)\b[^.?]{0,80}hygiene/i,
    ],
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
    // Food storage is covered by food_safety_violation — don't double-claim
    clearPatterns: [
      /improper\s+food\s+storage/i,
      /food[^.?]{0,40}improper storage/i,
      /raw meat/i,
    ],
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
 * Merge heuristic + AI claims by id, then collapse overlapping food-related duplicates.
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

  // Drop generic fallback when specific claims exist
  if (byId.size > 1 && byId.has('safety_hazard')) {
    byId.delete('safety_hazard')
  }

  // Collapse overlapping food claims into one (one photo = one food issue)
  const foodIds = ['food_safety_violation', 'improper_storage', 'hygiene_violation']
  const presentFood = foodIds.filter(id => byId.has(id))
  if (presentFood.length > 1) {
    const preferred =
      byId.get('food_safety_violation')
      || byId.get('improper_storage')
      || byId.get('hygiene_violation')

    // Only collapse hygiene into food when the hygiene label is food-related
    const hygiene = byId.get('hygiene_violation')
    const hygieneIsFood = hygiene && /food|meat|storage|uncovered|temperature|refriger|freezer/i.test(hygiene.label)
    const toDrop = presentFood.filter(id => {
      if (id === preferred.id) return false
      if (id === 'hygiene_violation' && !hygieneIsFood) return false
      return true
    })

    if (toDrop.length) {
      const mergedClasses = new Set(preferred.classNames || [preferred.id])
      for (const id of toDrop) {
        const c = byId.get(id)
        ;(c?.classNames || [id]).forEach(x => mergedClasses.add(x))
        byId.delete(id)
      }
      // Always accept food family classes for the surviving food claim
      ;['food_safety_violation', 'improper_storage'].forEach(x => mergedClasses.add(x))
      if (hygieneIsFood) mergedClasses.add('hygiene_violation')
      byId.set(preferred.id, {
        ...preferred,
        classNames: Array.from(mergedClasses),
      })
    }
  }

  return Array.from(byId.values())
}

function photoCoversClaimScore(claim, photo) {
  const hasViolation = photo.hasViolation || (photo.violationClass && photo.violationClass !== 'no_violation')
  if (!hasViolation) return 0

  const claimClasses = new Set(claim.classNames || [claim.id])
  const photoClass = photo.violationClass || ''
  const summary = (photo.summary || '').toLowerCase()
  const label = (claim.label || '').toLowerCase()

  let score = 0
  if (claimClasses.has(photoClass)) score += 5
  if (photoClass === claim.id) score += 2

  // Related food-family matching for one food photo covering one food claim
  const foodFamily = new Set(['food_safety_violation', 'improper_storage', 'hygiene_violation'])
  if (foodFamily.has(claim.id) && foodFamily.has(photoClass)) {
    if (/food|meat|storage|uncovered|temperature|freezer|refriger|tray|container/.test(`${label} ${summary}`)) {
      score += 4
    }
  }

  // Summary / label keyword boosts
  if (claim.id === 'missing_first_aid' && /first aid/.test(summary) && /(empty|missing|absent|unstocked)/.test(summary)) score += 5
  if (claim.id === 'missing_fire_equipment' && /(extinguish|fire equipment|bracket)/.test(summary) && /(missing|empty|absent|unavailable)/.test(summary)) score += 5
  if (claim.id === 'fire_exit_blocked' && /fire exit/.test(summary) && /(blocked|obstruct)/.test(summary)) score += 5

  // Weak label token overlap
  const labelTokens = label.split(/[^a-z0-9]+/).filter(t => t.length > 3)
  const overlap = labelTokens.filter(t => summary.includes(t)).length
  score += Math.min(overlap, 2)

  return score
}

/**
 * Match claims to photos 1:1 — each photo covers at most one claim.
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

  const violatingPhotos = photos.filter(
    p => p.hasViolation || (p.violationClass && p.violationClass !== 'no_violation')
  )

  // Build candidate pairs and greedily assign each photo to its best unmatched claim
  const pairs = []
  for (let pi = 0; pi < violatingPhotos.length; pi++) {
    for (let ci = 0; ci < claims.length; ci++) {
      const score = photoCoversClaimScore(claims[ci], violatingPhotos[pi])
      if (score > 0) pairs.push({ pi, ci, score })
    }
  }
  pairs.sort((a, b) => b.score - a.score)

  const usedPhotos = new Set()
  const coveredClaims = new Set()
  for (const pair of pairs) {
    if (usedPhotos.has(pair.pi) || coveredClaims.has(pair.ci)) continue
    usedPhotos.add(pair.pi)
    coveredClaims.add(pair.ci)
  }

  return claims.map((claim, ci) => {
    const covered = coveredClaims.has(ci)
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
