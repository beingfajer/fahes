import { readFile } from 'fs/promises'
import { resolveUploadPath } from '@/lib/storage'
import { analyzePhotoWithAzure } from '@/lib/ai'

const CONFIDENCE_THRESHOLD = parseFloat(process.env.ROBOFLOW_CONFIDENCE_THRESHOLD || '0.5')

const VIOLATION_DESCRIPTIONS = {
  blocked_fire_exit: 'A fire exit is blocked or obstructed, preventing safe evacuation in case of emergency.',
  fire_safety_equipment_hazard: 'Fire safety equipment is missing, damaged, expired, or improperly stored.',
  missing_first_aid: 'First aid kit is absent, empty, or not accessible in the required location.',
  exposed_electrical_hazard: 'Exposed or improperly installed electrical wiring posing a safety risk.',
  accessibility_ramp_violation: 'An accessibility ramp is missing, blocked, or does not meet safety standards.',
  missing_barrier: 'A required safety barrier or guardrail is missing, damaged, or improperly installed.',
  obstructed_path: 'A required clear path or walkway is obstructed by objects, debris, or equipment.',
  violation_detected_by_gpt4o: 'Violation identified through AI vision analysis.',
}

function getDescription(className) {
  return VIOLATION_DESCRIPTIONS[className] ||
    `A violation of type "${className.replace(/_/g, ' ')}" was detected in this image.`
}

function buildDetectionSummary(predictions) {
  if (!predictions?.length) return 'No violations detected in this image.'
  const top = predictions
    .slice(0, 5)
    .map(p => `${p.class} (${Math.round(p.confidence * 100)}%)`)
    .join(', ')
  return `Detected: ${top}`
}

function reportMentionsViolation(reportText) {
  if (!reportText) return false
  const keywords = [
    'violation', 'hazard', 'blocked', 'missing', 'expired',
    'unsafe', 'damaged', 'improper', 'non-compliant', 'issue', 'problem'
  ]
  const lower = reportText.toLowerCase()
  return keywords.some(k => lower.includes(k))
}

export async function analyzePhoto(relativePath, reportText = '') {
  const apiKey = process.env.ROBOFLOW_API_KEY
  const workflowUrl = process.env.ROBOFLOW_WORKFLOW_URL

  if (!apiKey || !workflowUrl) {
    return {
      detections: [],
      summary: 'Photo CV skipped — set ROBOFLOW_API_KEY and ROBOFLOW_WORKFLOW_URL in .env',
      source: 'skipped'
    }
  }

  const fullPath = resolveUploadPath(relativePath)
  const buffer = await readFile(fullPath)
  const base64 = buffer.toString('base64')

  // option 1: try Roboflow first
  const res = await fetch(workflowUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      inputs: { image: { type: 'base64', value: base64 } },
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    console.error(`Roboflow error ${res.status}: ${err}`)
    if (reportMentionsViolation(reportText)) {
      console.log('Roboflow failed — routing to Azure OpenAI')
      return analyzePhotoWithAzure(base64)
    }
    return { detections: [], summary: 'Photo analysis unavailable.', source: 'error' }
  }

  const data = await res.json()
  const output = data.outputs?.[0] || {}
  const rawPredictions = output.predictions?.predictions || []

  // filter by confidence threshold
  const confidentPredictions = rawPredictions.filter(
    p => p.confidence >= CONFIDENCE_THRESHOLD
  )

  const detections = confidentPredictions.map(p => ({
    class: p.class,
    confidence: p.confidence,
    description: getDescription(p.class),
    x: p.x,
    y: p.y,
    width: p.width,
    height: p.height,
  }))

  // option 2: Roboflow found nothing but report mentions violation, then route to Azure
  if (detections.length === 0 && reportMentionsViolation(reportText)) {
    console.log('Roboflow found nothing but report mentions violation — routing to Azure OpenAI')
    return analyzePhotoWithAzure(base64)
  }

  return {
    detections,
    summary: buildDetectionSummary(detections),
    source: 'roboflow'
  }
}

export function mergePhotoChecks(checks, photoResults) {
  if (!photoResults.length) return checks

  const anyDetection = photoResults.some(p => p.detections.length > 0)

  const photoCheck = {
    label: 'Violation detected in photo evidence',
    pass: anyDetection,
    hint: anyDetection
      ? ''
      : 'Photos were uploaded but no violation was detected. Review manually.',
  }

  return [...checks, photoCheck]
}