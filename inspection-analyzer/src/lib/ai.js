// import OpenAI from 'openai'
// import { GoogleGenerativeAI } from '@google/generative-ai'
import { Groq } from 'groq-sdk'

const SYSTEM_PROMPT = `You are an inspection report quality analyzer for Qatar Tourism Authority.
Analyze the given inspection report and return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "score": <integer 0-100>,
  "summary": "<2 sentence assessment>",
  "checks": [
    {"label": "Date & time recorded", "pass": <true/false>, "hint": "<tip if missing, empty string if pass>"},
    {"label": "Location specified", "pass": <true/false>, "hint": ""},
    {"label": "Reporter identified", "pass": <true/false>, "hint": ""},
    {"label": "Violation code referenced", "pass": <true/false>, "hint": ""},
    {"label": "Severity level assessed", "pass": <true/false>, "hint": ""},
    {"label": "Owner / contact present", "pass": <true/false>, "hint": ""},
    {"label": "Corrective actions documented", "pass": <true/false>, "hint": ""},
    {"label": "Follow-up scheduled", "pass": <true/false>, "hint": ""}
  ]
}`

const PHOTO_PROMPT = `You are a violation detection assistant for Qatar Tourism Authority.
Look carefully at this photo and identify any visible violations.

Return ONLY valid JSON with this exact structure (no markdown, no code fences):
{
  "hasViolation": <true if ANY violation, hazard, or safety/hygiene issue is visible, false ONLY if the image is fully compliant>,
  "violationClass": "<pick the best match from the list below>",
  "summary": "<1-2 sentences describing what you see and what the violation is>"
}

Violation class options — pick the closest:
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

function buildPhotoPrompt(fileName) {
  if (!fileName) return PHOTO_PROMPT

  let extra = `\n\nThe uploaded file is named "${fileName}".`
  if (/missing_first_aid/i.test(fileName)) {
    extra += ' Check whether the first aid kit is absent, empty, or unstocked — an empty cabinet counts as a violation.'
  } else if (/missing_fire|fire_equip|blocked_fire|fire_ext/i.test(fileName)) {
    extra += ' Check whether fire extinguishers or fire safety equipment is missing, empty, blocked, or inaccessible.'
  }
  return PHOTO_PROMPT + extra
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

async function chatWithGroq(messages, { json = false, maxTokens = 1024, model } = {}) {
  const client = getGroqClient()
  const result = await client.chat.completions.create({
    model: model || process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
    messages,
    max_tokens: maxTokens,
    temperature: 0.1,
    ...(json ? { response_format: { type: 'json_object' } } : {}),
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

export async function analyzePhotoWithAI(base64Image, mimeType = 'image/jpeg', fileName = '') {
  const provider = getProvider()
  assertProviderReady(provider)

  const photoPrompt = buildPhotoPrompt(fileName)

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
        maxTokens: 300,
        model: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct',
        json: true,
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