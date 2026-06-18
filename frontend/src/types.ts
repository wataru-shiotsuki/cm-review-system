export interface ReviewIssue {
  id: number
  category: string
  severity: string  
  scene: string
  description: string
  guideline_reference: string
  guideline_quote: string
  suggestion: string
}
export interface Findings {
  summary: string
  total_issues: number
  issues: ReviewIssue[]
  positive_points: string[]
}
export interface ReviewResult {
  summary?: string
  total_issues?: number
  issues?: ReviewIssue[]
  positive_points?: string[]
  raw_response?: string
}
export interface ReviewResponse {
  success: boolean
  result: ReviewResult
  filenames: string[]
  applied_pdfs: string[]
  failed_pdfs?: { filename: string; error: string }[]
}
export interface HealthData {
  status: string
  api_key_configured: boolean
  pdf_count: number
}
export interface PdfItem {
  id: string
  filename: string
  char_count?: number
}
export interface FilePreview {
  name: string
  size: number
  url: string | null
  type: 'image' | 'pdf'
}