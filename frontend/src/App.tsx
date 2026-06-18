import { useState, useCallback, useEffect, useRef } from 'react'
import type { HealthData, FilePreview, ReviewResponse, PdfItem } from './types'
import Header from './components/Header'
import GuidelineSelector from './components/GuidelineSelector'
import UploadZone from './components/UploadZone'
import FilePreviewList from './components/FilePreviewList'
import LoadingOverlay from './components/LoadingOverlay'
import ResultsView from './components/ResultsView'
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:8000'
function App() {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<FilePreview[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState<ReviewResponse | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [health, setHealth] = useState<HealthData | null>(null)
  const [pdfs, setPdfs] = useState<PdfItem[]>([])
  const [selectedPdfIds, setSelectedPdfIds] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])
  useEffect(() => {
    fetch(`${API_BASE}/api/health`)
      .then((res) => res.json())
      .then((data: HealthData) => setHealth(data))
      .catch(() => setHealth(null))
    fetch(`${API_BASE}/api/guidelines`)
      .then((res) => res.json())
      .then((data: { pdfs: PdfItem[] }) => {
        if (data.pdfs) setPdfs(data.pdfs)
      })
      .catch(() => setPdfs([]))
  }, [])
  const handleFiles = useCallback((newFiles: FileList) => {
    const fileArray = Array.from(newFiles).filter(
      (f) => f.type.startsWith('image/') || f.type === 'application/pdf'
    )
    if (fileArray.length === 0) return
    setFiles((prev) => [...prev, ...fileArray])
    setError(null)
    setResult(null)
    fileArray.forEach((file) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setPreviews((prev) => [
            ...prev,
            { name: file.name, size: file.size, url: e.target?.result as string, type: 'image' },
          ])
        }
        reader.readAsDataURL(file)
      } else {
        setPreviews((prev) => [
          ...prev,
          { name: file.name, size: file.size, url: null, type: 'pdf' },
        ])
      }
    })
  }, [])
  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
    setPreviews((prev) => prev.filter((_, i) => i !== index))
  }, [])
  const togglePdf = useCallback((id: string) => {
    setSelectedPdfIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }, [])
  const selectAllPdfs = useCallback(() => {
    setSelectedPdfIds(pdfs.map((p) => p.id))
  }, [pdfs])
  const clearAllPdfs = useCallback(() => {
    setSelectedPdfIds([])
  }, [])
  const handleSubmit = async () => {
    if (files.length === 0 || selectedPdfIds.length === 0) return
    setLoading(true)
    setError(null)
    setResult(null)
    setLoadingStep(0)
    const stepTimers = [
      setTimeout(() => setLoadingStep(1), 500),
      setTimeout(() => setLoadingStep(2), 2000),
      setTimeout(() => setLoadingStep(3), 5000),
    ]
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    try {
      const formData = new FormData()
      selectedPdfIds.forEach((id) => formData.append('pdf_ids', id))
      files.forEach((f) => formData.append('files', f))
      const res = await fetch(`${API_BASE}/api/review`, {
        method: 'POST',
        body: formData,
        signal: abortController.signal,
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'A server error occurred')
      }
      const data: ReviewResponse = await res.json()
      setResult(data)
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        console.log('Request aborted')
        return
      }
      setError(
        err instanceof Error
          ? err.message
          : 'A network error occurred. Please make sure the Backend Server is running.'
      )
    } finally {
      stepTimers.forEach(clearTimeout)
      setLoading(false)
    }
  }
  const handleReset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setFiles([])
    setPreviews([])
    setResult(null)
    setError(null)
    setSelectedPdfIds([])
    if (fileInputRef.current) fileInputRef.current.value = ''
  }
  const uploadDisabled = selectedPdfIds.length === 0
  return (
    <div className="app-container">
      <Header health={health} pdfCount={pdfs.length} />
      {!result && (
        <section className="upload-section">
          <GuidelineSelector
            pdfs={pdfs}
            selectedIds={selectedPdfIds}
            onToggle={togglePdf}
            onSelectAll={selectAllPdfs}
            onClearAll={clearAllPdfs}
          />
          <UploadZone onFiles={handleFiles} disabled={uploadDisabled} />
          <FilePreviewList previews={previews} onRemove={removeFile} />
          <div className="submit-section">
            <button
              className="submit-btn"
              disabled={files.length === 0 || selectedPdfIds.length === 0 || loading}
              onClick={handleSubmit}
            >
              <span className="btn-icon">&#x1F50D;</span>
              Run Compliance Check
            </button>
          </div>
        </section>
      )}
      {error && (
        <div className="error-card">
          <h3>An error occurred</h3>
          <p>{error}</p>
        </div>
      )}
      {loading && <LoadingOverlay loadingStep={loadingStep} selectedCount={selectedPdfIds.length} />}
      {result && result.result && (
        <ResultsView result={result} onReset={handleReset} />
      )}
    </div>
  )
}
export default App