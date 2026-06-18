import type { FilePreview } from '../types'
interface FilePreviewListProps {
  previews: FilePreview[]
  onRemove: (index: number) => void
}
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
export default function FilePreviewList({ previews, onRemove }: FilePreviewListProps) {
  if (previews.length === 0) return null
  return (
    <div className="file-preview-list">
      {previews.map((preview, idx) => (
        <div className="file-preview-item" key={idx}>
          {preview.type === 'image' && preview.url ? (
            <img src={preview.url} alt={preview.name} />
          ) : (
            <span style={{ fontSize: '28px' }}>&#x1F4C4;</span>
          )}
          <div>
            <div style={{ fontWeight: 500, color: 'var(--color-text-primary)', fontSize: '13px' }}>
              {preview.name}
            </div>
            <div style={{ fontSize: '11px', color: 'var(--color-text-muted)' }}>
              {formatFileSize(preview.size)}
            </div>
          </div>
          <button
            className="file-remove-btn"
            onClick={(e) => {
              e.stopPropagation()
              onRemove(idx)
            }}
            title="Delete"
          >
            &#x2715;
          </button>
        </div>
      ))}
    </div>
  )
}