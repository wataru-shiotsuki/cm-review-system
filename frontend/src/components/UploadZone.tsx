import { useCallback, useRef, useState } from 'react'
interface UploadZoneProps {
  onFiles: (files: FileList) => void
  disabled?: boolean
}
export default function UploadZone({ onFiles, disabled = false }: UploadZoneProps) {
  const [dragging, setDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) setDragging(true)
    },
    [disabled]
  )
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
  }, [])
  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setDragging(false)
      if (disabled) return
      onFiles(e.dataTransfer.files)
    },
    [onFiles, disabled]
  )
  return (
    <div
      className={`upload-zone ${dragging ? 'dragging' : ''} ${disabled ? 'disabled' : ''}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => !disabled && fileInputRef.current?.click()}
    >
      <div className="upload-icon">&#x1F4CB;</div>
      {disabled ? (
        <>
          <p className="upload-text">Please Select Guidelines First</p>
          <p className="upload-subtext">
            * This becomes active when you select one or more PDFs from the list above
          </p>
        </>
      ) : (
        <>
          <p className="upload-text">Drag & Drop Storyboard Images</p>
          <p className="upload-subtext">
            or click to select files (PNG, JPEG, WebP, PDF)
          </p>
        </>
      )}
      <input
        ref={fileInputRef}
        type="file"
        className="upload-input"
        accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
        multiple
        disabled={disabled}
        onChange={(e) => e.target.files && onFiles(e.target.files)}
      />
    </div>
  )
}