import type { ReviewIssue } from '../types'
export type OverallVerdict = 'fail' | 'warn' | 'pass'
export type CutStatus = 'violation' | 'warning' | 'ok'
export interface CutGroup {
  cutNumber: number | null  
  status: CutStatus
  issues: ReviewIssue[]
  positivePoints: string[]
}
export function extractCutNumbers(text: string): number[] {
  if (!text) return []
  const matches = text.matchAll(/Cut\s*(\d+)/g)
  return Array.from(matches).map((m) => parseInt(m[1], 10))
}
export function groupByCut(
  issues: ReviewIssue[],
  positivePoints: string[]
): CutGroup[] {
  const map = new Map<number, { issues: ReviewIssue[]; positives: string[] }>()
  const classified = new Set<ReviewIssue>()
  for (const issue of issues) {
    const nums = extractCutNumbers(issue.scene || '')
    for (const n of nums) {
      if (!map.has(n)) map.set(n, { issues: [], positives: [] })
      map.get(n)!.issues.push(issue)
      classified.add(issue)
    }
  }
  for (const pp of positivePoints) {
    const nums = extractCutNumbers(pp)
    for (const n of nums) {
      if (!map.has(n)) map.set(n, { issues: [], positives: [] })
      map.get(n)!.positives.push(pp)
    }
  }
  const groups: CutGroup[] = Array.from(map.entries())
    .sort(([a], [b]) => a - b)
    .map(([cutNumber, data]) => ({
      cutNumber,
      status: getCutStatus(data.issues),
      issues: data.issues,
      positivePoints: data.positives,
    }))
  const unclassified = issues.filter((i) => !classified.has(i))
  if (unclassified.length > 0) {
    groups.push({
      cutNumber: null,
      status: getCutStatus(unclassified),
      issues: unclassified,
      positivePoints: [],
    })
  }
  return groups
}
function getCutStatus(issues: ReviewIssue[]): CutStatus {
  if (issues.some((i) => i.severity === 'Clear Violation')) return 'violation'
  if (issues.length > 0) return 'warning'
  return 'ok'
}
export function getOverallVerdict(issues: ReviewIssue[]): OverallVerdict {
  if (issues.some((i) => i.severity === 'Clear Violation')) return 'fail'
  if (issues.length > 0) return 'warn'
  return 'pass'
}
export const verdictConfig: Record<
  OverallVerdict,
  { icon: string; label: string; message: string; className: string }
> = {
  fail: {
    icon: '🔴',
    label: 'Not Broadcastable',
    message: 'Contains clear violations. Please revise and resubmit for compliance review.',
    className: 'verdict-fail',
  },
  warn: {
    icon: '🟡',
    label: 'Revision Recommended',
    message: 'There are items needing confirmation. Please review and consider revisions.',
    className: 'verdict-warn',
  },
  pass: {
    icon: '🟢',
    label: 'No Issues',
    message: 'No issues found based on the guidelines.',
    className: 'verdict-pass',
  },
}
export const cutStatusConfig: Record<
  CutStatus,
  { icon: string; label: string; className: string }
> = {
  violation: { icon: '❌', label: 'Clear Violation', className: 'cut-violation' },
  warning: { icon: '⚠️', label: 'Needs Confirmation', className: 'cut-warning' },
  ok: { icon: '✅', label: 'No Issues', className: 'cut-ok' },
}