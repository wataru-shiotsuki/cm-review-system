interface LoadingOverlayProps {
  selectedCount: number
}
export default function LoadingOverlay({ selectedCount }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-text">Running Compliance Check...</p>
        <p className="loading-subtext">
          Reviewing {selectedCount} selected guideline{selectedCount === 1 ? '' : 's'}.{' '}
          Findings and references will appear when the review finishes.
        </p>
      </div>
    </div>
  )
}
