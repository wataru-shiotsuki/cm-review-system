import type { HealthData } from '../types'
interface HeaderProps {
  health: HealthData | null
  pdfCount: number
}
export default function Header({ health, pdfCount }: HeaderProps) {
  return (
    <header className="app-header">
      <div className="header-badge">
        <span className="badge-dot"></span>
        CM Review Automation
      </div>
      <h1 className="app-title">CM Compliance Automation System</h1>
      <p className="app-subtitle">
        Upload a storyboard and run an automated compliance check based on selected guidelines.
      </p>
      <div className="status-bar">
        <div className={`status-item ${health ? 'connected' : 'disconnected'}`}>
          <span className={`status-dot ${health ? 'green' : 'red'}`}></span>
          {health ? 'Server Connected' : 'Server Disconnected'}
        </div>
        {health && (
          <>
            <div className={`status-item ${health.api_key_configured ? 'connected' : 'disconnected'}`}>
              <span className={`status-dot ${health.api_key_configured ? 'green' : 'red'}`}></span>
              {health.api_key_configured ? 'API Key Configured' : 'API Key Not Set'}
            </div>
            <div className={`status-item ${pdfCount > 0 ? 'connected' : 'disconnected'}`}>
              <span className={`status-dot ${pdfCount > 0 ? 'green' : 'red'}`}></span>
              Available PDFs: {pdfCount}
            </div>
          </>
        )}
      </div>
      {health && !health.api_key_configured && (
        <div className="api-key-banner">
          <p>
            Gemini API Key is not configured.<br />
            Please enter your API key in the <code>backend/.env</code> file.
          </p>
        </div>
      )}
    </header>
  )
}