import OpenAI from 'openai'
import { GoogleGenerativeAI } from '@google/generative-ai'
import { Groq } from 'groq-sdk'

const SYSTEM_PROMPT = `You are an inspection report quality analyzer for Qatar Tourism Authority.
Analyze the given inspection report and return ONLY valid JSON (no markdown, no code fences) with this exact structure:
{
  "score": <integer 0-100>,
  "summary": "<2 sentence assessment>",
  "checks": [
    {"label": "Date & time recorded", "pass": <true/false>, "hint": "<tip if missing, empty string if pass>"},
    {"label": "Location specified", "pass": <true/false>, "hint": ""},
    {"label": "Violation code referenced", "pass": <true/false>, "hint": ""},
    {"label": "Severity level assessed", "pass": <true/false>, "hint": ""},
    {"label": "Owner / contact present", "pass": <true/false>, "hint": ""},
    {"label": "Action taken documented", "pass": <true/false>, "hint": ""},
    {"label": "Follow-up scheduled", "pass": <true/false>, "hint": ""}
  ]
}`

const PHOTO_PROMPT = `You are a violation detection assistant for Qatar Tourism Authority.
Look carefully at this photo and identify any visible violations such as:
- Blocked or obstructed fire exits
- Missing or damaged fire safety equipment
- Hygiene or food safety issues
- Improper storage
- Missing signage or safety notices
- Any other safety or compliance hazard
- Any other visible issue that may violate regulations

Return a plain 1-2 sentence description of what you see. If no violations are visible, say no violations found.`

function parseJson(raw) {
  const clean = raw.replace(/```json|```/g, '').trim()
  return JSON.parse(clean)
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
  if (provider === 'openai' && !process.env.OPENAI_API_KEY) {
    throw new Error('No AI key configured. Add OPENAI_API_KEY, GEMINI_API_KEY, or Azure OpenAI vars to .env')
  }
  if (provider === 'gemini' && !process.env.GEMINI_API_KEY) {
    throw new Error('GEMINI_API_KEY is not set')
  }
  if (provider === 'groq' && !process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not set')
  }
  if (provider === 'azure' && (!process.env.AZURE_OPENAI_KEY || !process.env.AZURE_OPENAI_ENDPOINT)) {
    throw new Error('AZURE_OPENAI_KEY and AZURE_OPENAI_ENDPOINT are required')
  }
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
  const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || 'gemini-2.0-flash' })
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
      throw new Error(
        'Azure OpenAI blocked public access. Connect to org VPN, ask IT to enable public access, or add OPENAI_API_KEY / GEMINI_API_KEY and set AI_PROVIDER=openai or gemini.'
      )
    }
    throw err
  }
}

export async function analyzePhotoWithAzure(base64Image, mimeType = 'image/jpeg') {
  const provider = getProvider()
  assertProviderReady(provider)

  let summary

  if (provider === 'gemini') {
    summary = (await chatWithGeminiVision(base64Image, mimeType, PHOTO_PROMPT)).trim()
  } else if (provider === 'groq') {
    summary = (await chatWithGroq([{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}` } },
        { type: 'text', text: PHOTO_PROMPT },
      ],
    }], {
      maxTokens: 300,
      model: process.env.GROQ_VISION_MODEL || 'meta-llama/llama-4-scout-17b-16e-instruct'
    })).trim()
  } else if (provider === 'azure') {
    summary = (await chatWithAzure([{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' } },
        { type: 'text', text: PHOTO_PROMPT },
      ],
    }], { maxTokens: 300 })).trim()
  } else {
    summary = (await chatWithOpenAI([{
      role: 'user',
      content: [
        { type: 'image_url', image_url: { url: `data:${mimeType};base64,${base64Image}`, detail: 'high' } },
        { type: 'text', text: PHOTO_PROMPT },
      ],
    }], { maxTokens: 300 })).trim()
  }

  const noViolation = summary.toLowerCase().includes('no violations found')
  return {
    detections: noViolation ? [] : [{ class: 'violation_detected_by_ai', confidence: 1 }],
    summary,
    source: provider,
  }
}
