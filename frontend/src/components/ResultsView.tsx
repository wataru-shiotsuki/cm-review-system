import type { ReviewResponse, Findings } from '../types'
import VerdictBanner from './VerdictBanner'
import CutView from './CutView'
interface ResultsViewProps {
  result: ReviewResponse
  onReset: () => void
}
export default function ResultsView({ result, onReset }: ResultsViewProps) {
  const data = result.result
  const appliedPdfs = result.applied_pdfs || []
  const findings: Findings = {
    summary: data.summary || '',
    total_issues: data.total_issues ?? 0,
    issues: data.issues || [],
    positive_points: data.positive_points || [],
  }
  return (
    <section className="results-section">
      <div className="results-header">
        <h2 className="results-title">Compliance Results</h2>
      </div>
      {}
      <VerdictBanner issues={findings.issues} />
      {}
      {findings.issues.length > 0 && (
        <div className="issues-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="issues-title" style={{ marginBottom: 0 }}>Results by Cut</h3>
            <span style={{ fontSize: '12px', color: 'var(--color-text-muted)' }}>
              * Page references are checked when the quoted text is found. Verify them in the source PDF.
            </span>
          </div>
          <CutView issues={findings.issues} positivePoints={findings.positive_points || []} />
        </div>
      )}
      {}
      {appliedPdfs.length > 0 && (
        <div className="applied-pdfs-banner applied-pdfs-footer">
          <div className="applied-pdfs-title">
            Applied PDFs ({appliedPdfs.length})
          </div>
          <ul className="applied-pdfs-list">
            {appliedPdfs.map((name) => (
              <li key={name}>{name}</li>
            ))}
          </ul>
        </div>
      )}
      <div className="reset-section">
        <button className="reset-btn" onClick={onReset}>
          Run New Compliance Check
        </button>
      </div>
    </section>
  )
}
