import { mkdir, writeFile } from 'fs/promises'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_ROOT = path.join(process.cwd(), 'uploads')

export function getUploadRoot() {
  return UPLOAD_ROOT
}

export function resolveUploadPath(relativePath) {
  const full = path.join(UPLOAD_ROOT, relativePath)
  if (!full.startsWith(UPLOAD_ROOT)) {
    throw new Error('Invalid file path')
  }
  return full
}

export async function saveUploadedFile(file, subfolder) {
  const ext = path.extname(file.name) || ''
  const relativePath = path.join(subfolder, `${randomUUID()}${ext}`)
  const fullPath = resolveUploadPath(relativePath)

  await mkdir(path.dirname(fullPath), { recursive: true })
  const buffer = Buffer.from(await file.arrayBuffer())
  await writeFile(fullPath, buffer)

  return { relativePath, fileName: file.name, buffer }
}
