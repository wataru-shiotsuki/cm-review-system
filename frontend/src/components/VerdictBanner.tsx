import type { ReviewIssue } from '../types'
import { getOverallVerdict, verdictConfig } from '../utils/cutAnalysis'
interface VerdictBannerProps {
  issues: ReviewIssue[]
}
export default function VerdictBanner({ issues }: VerdictBannerProps) {
  const verdict = getOverallVerdict(issues)
  const config = verdictConfig[verdict]
  const violationCount = issues.filter((i) => i.severity === 'Clear Violation').length
  const warningCount = issues.filter((i) => i.severity !== 'Clear Violation').length
  return (
    <div className={`verdict-banner ${config.className}`}>
      <div className="verdict-icon">{config.icon}</div>
      <div className="verdict-body">
        <div className="verdict-label">{config.label}</div>
        <div className="verdict-message">{config.message}</div>
        {issues.length > 0 && (
          <div className="verdict-counts">
            {violationCount > 0 && (
              <span className="verdict-count violation">
                Clear Violations: {violationCount}
              </span>
            )}
            {warningCount > 0 && (
              <span className="verdict-count warning">
                Needs Confirmation: {warningCount}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}