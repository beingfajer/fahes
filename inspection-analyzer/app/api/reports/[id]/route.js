import { NextResponse } from 'next/server'
import { reportRepository } from '@/repositories/reportRepository'

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const report = await reportRepository.findById(id)
    if (!report) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json(report)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = await params
    await reportRepository.delete(id)
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 })
  }
}