import mammoth from 'mammoth'

export async function extractTextFromDocument(buffer, mimeType, fileName) {
  const ext = fileName.split('.').pop()?.toLowerCase()

  if (mimeType === 'application/pdf' || ext === 'pdf') {
    const pdfParse = (await import('pdf-parse')).default
    const data = await pdfParse(buffer)
    return data.text?.trim() || ''
  }

  if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    ext === 'docx'
  ) {
    const result = await mammoth.extractRawText({ buffer })
    return result.value?.trim() || ''
  }

  if (mimeType === 'application/msword' || ext === 'doc') {
    throw new Error('Legacy .doc files are not supported. Please save as .docx or PDF.')
  }

  throw new Error('Unsupported document type. Upload a PDF or Word (.docx) file.')
}
