import type { PdfItem } from '../types'
interface GuidelineSelectorProps {
  pdfs: PdfItem[]
  selectedIds: string[]
  onToggle: (id: string) => void
  onSelectAll: () => void
  onClearAll: () => void
}
const TOKEN_LIMIT = 1_048_576
const CHARS_TO_TOKENS = 1.3
function estimateTokens(chars: number): number {
  return Math.round(chars * CHARS_TO_TOKENS)
}
function formatCompact(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(2)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`
  return String(n)
}
export default function GuidelineSelector({
  pdfs,
  selectedIds,
  onToggle,
  onSelectAll,
  onClearAll,
}: GuidelineSelectorProps) {
  const total = pdfs.length
  const selected = selectedIds.length
  const allSelected = total > 0 && selected === total
  const selectedPdfs = pdfs.filter((p) => selectedIds.includes(p.id))
  const selectedChars = selectedPdfs.reduce((sum, p) => sum + (p.char_count ?? 0), 0)
  const selectedTokens = estimateTokens(selectedChars)
  const maxSinglePdfChars = selectedPdfs.reduce((max, p) => Math.max(max, p.char_count ?? 0), 0)
  const maxSinglePdfTokens = estimateTokens(maxSinglePdfChars)
  const usageForDisplay = selectedTokens / TOKEN_LIMIT 
  const usageForWarning = maxSinglePdfTokens / TOKEN_LIMIT 
  let usageLevel: 'low' | 'mid' | 'high' | 'over' = 'low'
  if (usageForWarning >= 1.0) usageLevel = 'over'
  else if (usageForWarning >= 0.85) usageLevel = 'high'
  else if (usageForDisplay >= 0.6) usageLevel = 'mid' 
  const barWidthPct = Math.min(usageForDisplay * 100, 100)
  return (
    <div className="guideline-selector">
      <div className="guideline-selector-header">
        <label className="guideline-label">Guidelines to Reference</label>
        <span className="guideline-counter">
          Selected: {selected}/{total}
        </span>
      </div>
      <div className="guideline-actions">
        <button
          type="button"
          className="guideline-action-btn"
          onClick={onSelectAll}
          disabled={allSelected}
        >
          Select All
        </button>
        <button
          type="button"
          className="guideline-action-btn"
          onClick={onClearAll}
          disabled={selected === 0}
        >
          Clear All
        </button>
      </div>
      {selected > 0 && (
        <div className={`token-usage token-usage-${usageLevel}`}>
          <div className="token-usage-label">
            <span>
              Estimated Token Usage: {formatCompact(selectedTokens)} /{' '}
              {formatCompact(TOKEN_LIMIT)}
            </span>
            <span className="token-usage-pct">{Math.round(usageForDisplay * 100)}%</span>
          </div>
          <div className="token-usage-bar">
            <div
              className="token-usage-bar-fill"
              style={{ width: `${barWidthPct}%` }}
            />
          </div>
          {usageLevel === 'over' && (
            <p className="token-usage-warn">
              ⚠️ Limit exceeded. This may cause an error during the check. Please select fewer PDFs.
            </p>
          )}
          {usageLevel === 'high' && (
            <p className="token-usage-warn">
              ⚠️ Approaching limit. Consider deselecting large PDFs or reducing the selection.
            </p>
          )}
        </div>
      )}
      <div className="guideline-list">
        {pdfs.length === 0 && (
          <p className="guideline-empty">No guideline PDFs found.</p>
        )}
        {pdfs.map((pdf) => {
          const checked = selectedIds.includes(pdf.id)
          const pdfTokens = estimateTokens(pdf.char_count ?? 0)
          const isEmpty = pdf.char_count === 0
          return (
            <label
              key={pdf.id}
              className={`pdf-checkbox-row ${checked ? 'checked' : ''} ${isEmpty ? 'pdf-empty-warn' : ''}`}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => onToggle(pdf.id)}
              />
              <span className="pdf-checkbox-filename">{pdf.filename}</span>
              {pdf.char_count !== undefined && (
                <span className="pdf-checkbox-tokens" style={{ color: isEmpty ? 'var(--severity-high)' : undefined }}>
                  {isEmpty ? '⚠️ No text data (Scanned Image)' : `${formatCompact(pdfTokens)} tok`}
                </span>
              )}
            </label>
          )
        })}
      </div>
      {selected === 0 && total > 0 && (
        <p className="guideline-hint">
          * Please select one or more guidelines to use for the compliance check
        </p>
      )}
    </div>
  )
}