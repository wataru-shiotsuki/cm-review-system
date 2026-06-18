import type { ReviewIssue } from '../types'
import { groupByCut, cutStatusConfig } from '../utils/cutAnalysis'
import IssueCard from './IssueCard'
interface CutViewProps {
  issues: ReviewIssue[]
  positivePoints: string[]
}
export default function CutView({ issues, positivePoints }: CutViewProps) {
  const cuts = groupByCut(issues, positivePoints)
  if (cuts.length === 0) {
    return (
      <div className="cut-view-empty">
        Cut番号が特定できませんでした。
      </div>
    )
  }
  const issueCuts = cuts.filter((c) => c.status !== 'ok')
  const okCuts = cuts.filter((c) => c.status === 'ok')
  const formatCutLabel = (cutNumber: number | null) =>
    cutNumber === null ? '未分類' : `Cut${cutNumber}`
  return (
    <div className="cut-view">
      {}
      {issueCuts.map((cut) => {
        const statusConf = cutStatusConfig[cut.status]
        const issueCount = cut.issues.length
        const title = formatCutLabel(cut.cutNumber)
        const key = cut.cutNumber === null ? 'unclassified' : cut.cutNumber
        return (
          <div key={key} className={`cut-group ${statusConf.className}`}>
            <div className="cut-group-header">
              <span className="cut-group-title">
                <span className="cut-group-icon">{statusConf.icon}</span>
                {title}
              </span>
              <span className="cut-group-status">
                {statusConf.label}
                {issueCount > 0 && `・${issueCount}件`}
              </span>
            </div>
            {cut.issues.length > 0 && (
              <div className="cut-group-issues">
                {cut.issues.map((issue, idx) => (
                  <IssueCard key={`${key}-${issue.id ?? idx}`} issue={issue} index={idx} />
                ))}
              </div>
            )}
          </div>
        )
      })}
      {}
      {okCuts.length > 0 && (
        <div className="cut-group cut-ok cut-group-compact">
          <div className="cut-group-header">
            <span className="cut-group-title">
              <span className="cut-group-icon">{cutStatusConfig.ok.icon}</span>
              <span className="cut-compact-label">問題なし:</span>
              <span className="cut-compact-list">
                {okCuts.map((c) => formatCutLabel(c.cutNumber)).join('、')}
              </span>
            </span>
            <span className="cut-group-status">{okCuts.length}Cut</span>
          </div>
        </div>
      )}
    </div>
  )
}