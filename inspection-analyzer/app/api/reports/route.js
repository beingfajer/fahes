import { NextResponse } from 'next/server'
import { reportRepository } from '@/repositories/reportRepository'

export async function GET() {
  try {
    return NextResponse.json(await reportRepository.findAll())
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { text, documentName, documentPath, score, summary, checks, photos } = await request.json()
    const report = await reportRepository.create({
      text,
      documentName,
      documentPath,
      score,
      summary,
      checks,
      photos,
    })
    return NextResponse.json(report, { status: 201 })
  } catch (e) {
    console.error(e)
    return NextResponse.json({ error: 'Failed to save' }, { status: 500 })
  }
}
