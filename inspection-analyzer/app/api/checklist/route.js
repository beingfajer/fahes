import { NextResponse } from 'next/server'
import { checklistRepository } from '@/repositories/checklistRepository'

export async function PATCH(request) {
  try {
    const { id, pass } = await request.json()
    const updated = await checklistRepository.updatePass(id, pass)
    return NextResponse.json(updated)
  } catch (e) {
    return NextResponse.json({ error: 'Failed to update' }, { status: 500 })
  }
}