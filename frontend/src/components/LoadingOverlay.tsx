interface LoadingOverlayProps {
  loadingStep: number
  selectedCount: number
}
export default function LoadingOverlay({ loadingStep, selectedCount }: LoadingOverlayProps) {
  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <div className="loading-spinner"></div>
        <p className="loading-text">Running Compliance Check...</p>
        <p className="loading-subtext">AI is analyzing based on the guidelines</p>
        <div className="loading-steps">
          <div className={`loading-step ${loadingStep >= 0 ? 'active' : ''} ${loadingStep > 0 ? 'done' : ''}`}>
            <span className="loading-step-icon">{loadingStep > 0 ? '✓' : '⏳'}</span>
            Loading storyboard images...
          </div>
          <div className={`loading-step ${loadingStep >= 1 ? 'active' : ''} ${loadingStep > 1 ? 'done' : ''}`}>
            <span className="loading-step-icon">
              {loadingStep > 1 ? '✓' : loadingStep >= 1 ? '⏳' : '○'}
            </span>
            Checking against {selectedCount} selected guidelines...
          </div>
          <div className={`loading-step ${loadingStep >= 2 ? 'active' : ''} ${loadingStep > 2 ? 'done' : ''}`}>
            <span className="loading-step-icon">
              {loadingStep > 2 ? '✓' : loadingStep >= 2 ? '⏳' : '○'}
            </span>
            Running violation check...
          </div>
          <div className={`loading-step ${loadingStep >= 3 ? 'active' : ''}`}>
            <span className="loading-step-icon">{loadingStep >= 3 ? '⏳' : '○'}</span>
            Compiling results...
          </div>
        </div>
      </div>
    </div>
  )
}