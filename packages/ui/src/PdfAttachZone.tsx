import { useRef, useState, type ChangeEvent } from 'react'
import './PdfAttachZone.css'

type PdfAttachment = { name: string; dataUrl: string }

type PdfAttachZoneProps = {
  attachment?: PdfAttachment | null
  onAttach: (file: PdfAttachment) => void
  onRemove?: () => void
  label?: string
}

export function PdfAttachZone({ attachment, onAttach, onRemove, label = 'Attach Lab Report PDF' }: PdfAttachZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError('')
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5 MB')
      return
    }
    setLoading(true)
    const reader = new FileReader()
    reader.onload = () => {
      setLoading(false)
      onAttach({ name: file.name, dataUrl: reader.result as string })
    }
    reader.onerror = () => {
      setLoading(false)
      setError('Could not read file')
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (attachment) {
    return (
      <div className="pdf-item">
        <span className="pdf-item__icon">📄</span>
        <span className="pdf-item__name">{attachment.name}</span>
        <a href={attachment.dataUrl} target="_blank" rel="noreferrer" className="pdf-item__view">View</a>
        {onRemove && (
          <button type="button" className="pdf-item__remove" onClick={onRemove}>Remove</button>
        )}
      </div>
    )
  }

  return (
    <div className="pdf-attach">
      <button type="button" className="pdf-attach-zone" onClick={() => inputRef.current?.click()} disabled={loading}>
        <input ref={inputRef} type="file" accept=".pdf,image/*" onChange={handleFile} hidden />
        <div className="pdf-attach-zone__icon">📎</div>
        <div className="pdf-attach-zone__title">{loading ? 'Uploading…' : label}</div>
        <div className="pdf-attach-zone__hint">PDF or image · max 5 MB · scanned PDFs use OCR</div>
      </button>
      {error && <div className="pdf-attach__error">{error}</div>}
    </div>
  )
}

export type { PdfAttachment }
