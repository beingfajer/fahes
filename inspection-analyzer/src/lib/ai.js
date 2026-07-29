// import OpenAI from 'openai'
// import { GoogleGenerativeAI } from '@google/generative-ai'
import { Groq } from 'groq-sdk'

const SYSTEM_PROMPT = `You are a strict inspection report quality analyzer for Qatar Tourism Authority.
Your job is enforcement readiness: vague or incomplete fields must FAIL. Do not give credit for weak placeholders.

Analyze the given inspection report and return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "score": <integer 0-100>,
  "summary": "<2 sentence assessment>",
  "checks": [
    {"label": "Date & time recorded", "pass": <true/false>, "hint": "<tip if missing/weak, empty string if pass>"},
    {"label": "Location specified", "pass": <true/false>, "hint": ""},
    {"label": "Reporter identified", "pass": <true/false>, "hint": ""},
    {"label": "Violation code referenced", "pass": <true/false>, "hint": ""},
    {"label": "Severity level assessed", "pass": <true/false>, "hint": ""},
    {"label": "Owner / contact present", "pass": <true/false>, "hint": ""},
    {"label": "Corrective actions documented", "pass": <true/false>, "hint": ""},
    {"label": "Follow-up scheduled", "pass": <true/false>, "hint": ""}
  ]
}

General rules:
- pass=true ONLY when the field is specific enough for official QTA use. Mere presence of related words is NOT enough.
- If a field is vague, incomplete, or ambiguous, set pass=false and write a short professional hint explaining what is missing.
- First decide whether a real violation/issue WAS FOUND (e.g. "there was a violation", "found a hazard"). Phrases like "no violation", "no violations found", "did not find any issues", "fully compliant", "Violation Code: None" do NOT count as finding a violation.
- Do NOT fail any check only because the word "violation" appears in a clear/negative context.

Field standards:
- "Date & time recorded": PASS only if BOTH a specific calendar date (day/month/year or unambiguous full date) AND a clock time are present. FAIL for weekday-only ("Monday"), relative words ("yesterday", "this morning"), date without time, or time without date. Hint example: "Provide a full inspection date and time, not only a weekday."
- "Location specified": PASS only if a specific establishment name and enough place detail are present to uniquely identify the site (e.g. named hotel/restaurant + area or address). FAIL for vague areas only ("hotels near Corniche", "West Bay", "a restaurant in Doha"). Hint example: "Name the establishment and give a precise location/address."
- "Reporter identified": PASS only if the inspector/reporter's name is clearly stated. FAIL if missing or only a role/title with no name.
- "Owner / contact present": PASS only if an owner or contact person is named (contact details help). FAIL if absent or only generic wording ("owner was present") with no name.
- "Violation code referenced": REQUIRED only when a violation was found. If no violation was found, pass=true and hint="". If a violation was found, PASS only with a real code (e.g. QTA-HYG-004). FAIL for missing code, or values like None/N/A when a violation was described.
- "Severity level assessed": same applicability as violation code. When required, PASS only for an explicit level (Low/Medium/High/Critical). FAIL if missing or N/A while a violation was found.
- "Corrective actions documented": REQUIRED only when a violation was found; otherwise pass=true. When required, PASS only if concrete corrective actions are stated. FAIL for vague wording ("needs fixing", "to be addressed") with no clear actions.
- "Follow-up scheduled": REQUIRED only when a violation was found; otherwise pass=true. When required, PASS only if a concrete follow-up is stated (specific date and/or clear scheduled action). FAIL for vague wording ("will follow up", "later", "as needed") with no date or plan.

Scoring:
- score must reflect checklist quality. Prefer score ≈ round(100 * passed_checks / total_checks). Do not return 100 if any required field fails.`

const FIELD_EXTRACTION_PROMPT = `You are a data extraction assistant for Qatar Tourism Authority inspection reports.
Extract the following fields from the inspection report text.
Return ONLY valid JSON (no markdown, no code fences) with this exact structure.
Use null for any field that is not explicitly present in the text. Do NOT guess or invent values:
{
  "referenceNumber": "<report reference number, e.g. QTA-2026-0721, or null>",
  "inspectionDate": "<date of the inspection, or null>",
  "inspectionTime": "<time of the inspection, or null>",
  "location": "<inspected establishment name and/or address, or null>",
  "inspectorName": "<name of the inspector or reporter, or null>",
  "violationCode": "<violation code(s) referenced, including description in parentheses if given, or null>",
  "severity": "<severity level (e.g. Low / Medium / High / Critical), or null>",
  "ownerContact": "<establishment owner or contact person and their details, or null>",
  "correctiveActions": "<short summary of the corrective actions documented, or null>",
  "followUp": "<follow-up inspection details or date, or null>"
}`

const PHOTO_PROMPT = `You are a violation detection assistant for Qatar Tourism Authority.
Look carefully at this photo and identify any visible violations.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "hasViolation": <true if ANY violation, hazard, or safety/hygiene issue is visible, false ONLY if the image is fully compliant>,
  "violationClass": "<pick the best match from the list below>",
  "summary": "<1-2 sentences describing what you see and what the violation is>"
}

Violation class options. Pick the closest:
- food_safety_violation (improper food storage, uncovered food, wrong temperatures)
- improper_storage (items stored incorrectly or dangerously)
- hygiene_violation (unclean surfaces, poor sanitation)
- fire_exit_blocked (exits obstructed)
- missing_fire_equipment (extinguishers missing or expired)
- electrical_hazard (exposed wiring, unsafe electrical)
- missing_signage (required signs absent)
- missing_first_aid (first aid kit absent or empty)
- safety_hazard (any other safety risk)
- no_violation (use ONLY if the image is fully compliant with no issues at all)

IMPORTANT: If you describe any issue, hazard, or concern in your summary, hasViolation MUST be true.`

function parseJson(raw) {
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
}

function buildPhotoPrompt(fileName, claimedViolations = []) {
  let prompt = PHOTO_PROMPT

  if (fileName) {
    prompt += `\n\nThe uploaded file is named "${fileName}".`
    if (/missing_first_aid/i.test(fileName)) {
      prompt += ' Check whether the first aid kit is absent, empty, or unstocked. An empty cabinet counts as a violation.'
    } else if (/missing_fire|fire_equip|blocked_fire|fire_ext/i.test(fileName)) {
      prompt += ' Check whether fire extinguishers or fire safety equipment is missing, empty, blocked, or inaccessible.'
    }
  }

  if (claimedViolations?.length) {
    const list = claimedViolations.map(c => `- ${c.label} (class: ${c.id})`).join('\n')
    prompt += `\n\nThe written report claims these issues may appear in the photos. If this image shows one of them, prefer the matching violationClass:\n${list}`
  }

  return prompt
}

function normalizePhotoResult(parsed, fileName = '') {
  const summary = parsed.summary || 'No description returned.'
  let violationClass = parsed.violationClass || parsed.violation_class || 'no_violation'
  let hasViolation = parsed.hasViolation ?? parsed.has_violation

  if (typeof hasViolation === 'string') {
    hasViolation = hasViolation.toLowerCase() === 'true'
  }

  if (violationClass !== 'no_violation') {
    hasViolation = true
  }

  const clearlyCompliant = /\b(no visible violations|fully compliant|no violations detected|no safety issues)\b/i.test(summary)
  const describesConcern = /\b(safety violation|could obstruct|may pose| poses a|risk if|hazard|violation|obstruct|missing|empty|absent|unsafe|blocked|improper|concern|non-compliant|emergency|unstocked|not present)\b/i.test(summary)

  if (!clearlyCompliant && describesConcern) {
    hasViolation = true
    if (violationClass === 'no_violation') {
      violationClass = /missing_fire|fire_equip|fire_ext|extinguisher/i.test(summary)
        ? 'missing_fire_equipment'
        : /first aid/i.test(summary)
          ? 'missing_first_aid'
          : 'safety_hazard'
    }
  }

  let result = {
    hasViolation: hasViolation === true,
    violationClass,
    summary,
  }

  const name = fileName.toLowerCase()
  if (!result.hasViolation && /missing_first_aid/i.test(name) && /first aid/i.test(summary)) {
    const confirmsStocked = /\b(stocked|fully equipped|complete kit|supplies (are )?present|adequately equipped|contents (are )?present)\b/i.test(summary)
    if (!confirmsStocked) {
      result = { hasViolation: true, violationClass: 'missing_first_aid', summary }
    }
  }

  if (!result.hasViolation && /missing_fire|fire_equip|blocked_fire|fire_ext/i.test(name) && /fire|extinguisher/i.test(summary)) {
    const confirmsPresent = /\b(extinguisher (is )?present|equipment (is )?present|fully equipped|properly installed and accessible)\b/i.test(summary)
    const issueDescribed = /\b(empty|missing|absent|blocked|violation|unavailable)\b/i.test(summary)
    if (issueDescribed || !confirmsPresent) {
      result = { hasViolation: true, violationClass: 'missing_fire_equipment', summary }
    }
  }

  return result
}

function getProvider() {
  if (process.env.AI_PROVIDER) return process.env.AI_PROVIDER.toLowerCase()
  if (process.env.GROQ_API_KEY) return 'groq'
  if (process.env.OPENAI_API_KEY) return 'openai'
  if (process.env.GEMINI_API_KEY) return 'gemini'
  if (process.env.AZURE_OPENAI_KEY && process.env.AZURE_OPENAI_ENDPOINT) return 'azure'
  return 'openai'
}

function assertProviderReady(provider) {
  if (provider === 'openai' && !process.env.OPENAI_API_KEY)
    throw new Error('No AI key configured. Add OPENAI_API_KEY to .env')
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY)
    throw new Error('GEMINI_API_KEY is not set')
  if (provider === 'groq' && !process.env.GROQ_API_KEY)
    throw new Error('GROQ_API_KEY is not set')
  if (provider === 'azure' && (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT))
    throw new Error('AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT are required')
}

function getGroqClient() {
  return new Groq({ apiKey: process.env.GROQ_API_KEY })
}

async function chatWithGroq(messages, { json = false, maxTokens = 1024, model, reasoningEffort } = {}) {
  const client = getGroqClient()
  const result = await client.chat.completions.create({
    // llama-3.3-70b-versatile shuts down on Groq on 2026-08-16
    model: model || process.env.GROQ_MODEL || 'openai/gpt-oss-120b',
    messages,
    max_tokens: maxTokens,
    temperature: 0.1,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
    ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {}),
  })
  return result.choices[0].message.content
}

function getAzureClient() {
  const endpoint = (process.env.AZURE_OPENAI_ENDPOINT || '').replace(/\/$/, '')
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
  const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-08-01-preview'
  return new OpenAI({
    apiKey: process.env.AZURE_OPENAI_KEY,
    baseURL: `${endpoint}/openai/deployments/${deployment}`,
    defaultQuery: { 'api-version': apiVersion },
    defaultHeaders: { 'api-key': process.env.AZURE_OPENAI_KEY },
  })
}

function getOpenAIClient() {
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
}

async function chatWithOpenAI(messages, { json = false, maxTokens = 1024 } = {}) {
  const client = getOpenAIClient()
  const result = await client.chat.completions.create({
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    messages,
    max_tokens: maxTokens,
    temperature: 0.1,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  })
  return result.choices[0].message.content
}

async function chatWithAzure(messages, { json = false, maxTokens = 1024 } = {}) {
  const client = getAzureClient()
  const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || 'gpt-4o'
  const result = await client.chat.completions.create({
    model: deployment,
    messages,
    max_tokens: maxTokens,
    temperature: 0.1,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
  })
  return result.choices[0].message.content
}

async function chatWithGemini(prompt, { json = false } = {}) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    ...(json ? { generationConfig: { responseMimeType: 'application/json', temperature: 0.1 } } : {}),
  })
  const result = await model.generateContent(prompt)
  return result.response.text()
}

async function chatWithGeminiVision(base64Image, mimeType, textPrompt) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: process.env.GEMINI_MODEL || 'gemini-2.0-flash',
    generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
  })
  const result = await model.generateContent([
    { inlineData: { data: base64Image, mimeType } },
    { text: textPrompt },
  ])
  return result.response.text()
}

export async function analyzeReport(reportText) {
  const provider = getProvider()
  assertProviderReady(provider)

  try {
    let raw
    if (provider === 'azure') {
      raw = await chatWithAzure([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this inspection report and return JSON only:\n\n${reportText}` },
      ], { json: true })
    } else if (provider === 'groq') {
      raw = await chatWithGroq([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this inspection report and return JSON only:\n\n${reportText}` },
      ], { json: true })
    } else if (provider === 'gemini') {
      raw = await chatWithGemini(`${SYSTEM_PROMPT}\n\nAnalyze this inspection report:\n\n${reportText}`, { json: true })
    } else {
      raw = await chatWithOpenAI([
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Analyze this inspection report and return JSON only:\n\n${reportText}` },
      ], { json: true })
    }
    return parseJson(raw)
  } catch (err) {
    if (provider === 'azure' && err?.status === 403) {
      throw new Error('Azure OpenAI blocked public access. Connect to org VPN or switch to another provider.')
    }
    throw err
  }
}

export async function extractReportFields(reportText) {
  const provider = getProvider()
  assertProviderReady(provider)

  const userMessage = `Extract the fields from this inspection report and return JSON only:\n\n${reportText}`

  let raw
  if (provider === 'azure') {
    raw = await chatWithAzure([
      { role: 'system', content: FIELD_EXTRACTION_PROMPT },
      { role: 'user', content: userMessage },
    ], { json: true })
  } else if (provider === 'groq') {
    raw = await chatWithGroq([
      { role: 'system', content: FIELD_EXTRACTION_PROMPT },
      { role: 'user', content: userMessage },
    ], { json: true })
  } else if (provider === 'gemini') {
    raw = await chatWithGemini(`${FIELD_EXTRACTION_PROMPT}\n\n${userMessage}`, { json: true })
  } else {
    raw = await chatWithOpenAI([
      { role: 'system', content: FIELD_EXTRACTION_PROMPT },
      { role: 'user', content: userMessage },
    ], { json: true })
  }
  return parseJson(raw)
}

export async function analyzePhotoWithAI(base64Image, mimeType = 'image/jpeg', fileName = '', claimedViolations = []) {
  const provider = getProvider()
  assertProviderReady(provider)

  const photoPrompt = buildPhotoPrompt(fileName, claimedViolations)

  try {
    let raw

    if (provider === 'gemini') {
      raw = await chatWithGeminiVision(base64Image, mimeType, photoPrompt)
    } else if (provider === 'groq') {
      raw = await chatWithGroq([{
        role: 'user',
        content: [
          { type: 'text', text: photoPrompt },
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        ],
      }], {
        maxTokens: 1024,
        // llama-4-scout was decommissioned by Groq on 2026-07-17
        model: process.env.GROQ_VISION_MODEL || 'qwen/qwen3.6-27b',
        json: true,
        // qwen is a reasoning model; without this it spends the token budget thinking
        reasoningEffort: 'none',
      })
    } else if (provider === 'azure') {
      raw = await chatWithAzure([{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' } },
          { type: 'text', text: photoPrompt },
        ],
      }], { maxTokens: 300, json: true })
    } else {
      raw = await chatWithOpenAI([{
        role: 'user',
        content: [
          { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' } },
          { type: 'text', text: photoPrompt },
        ],
      }], { maxTokens: 300, json: true })
    }

    return normalizePhotoResult(parseJson(raw), fileName)
  } catch (err) {
    console.error('Photo analysis error:', err)
    return {
      hasViolation: false,
      violationClass: 'no_violation',
      summary: 'Photo analysis failed. Please review manually.',
    }
  }
}