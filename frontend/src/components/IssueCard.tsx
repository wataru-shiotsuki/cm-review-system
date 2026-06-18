import type { ReviewIssue } from '../types'
interface IssueCardProps {
  issue: ReviewIssue
  index: number
}
export default function IssueCard({ issue }: IssueCardProps) {
  const severityClass = issue.severity === 'Clear Violation' ? 'high' : 'medium'
  return (
    <div className="issue-card">
      <div className="issue-header">
        <span className={`severity-badge ${severityClass}`}>
          {issue.severity || 'Needs Confirmation'}
        </span>
        {issue.category && <span className="issue-category">{issue.category}</span>}
      </div>
      <p className="issue-description">{issue.description}</p>
      {(issue.guideline_reference || issue.suggestion) && (
        <div className="issue-details">
          {issue.guideline_reference && (
            <div className="issue-detail full-width-detail">
              <div className="issue-detail-label">Guideline Reference</div>
              <div className="issue-detail-value">
                <span className="reference-text">{issue.guideline_reference}</span>
                {issue.guideline_quote && (
                  <div className="quote-text">「{issue.guideline_quote}」</div>
                )}
              </div>
            </div>
          )}
          {issue.suggestion && (
            <div className="issue-detail full-width-detail">
              <div className="issue-detail-label">Suggestion</div>
              <div className="issue-detail-value">{issue.suggestion}</div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}