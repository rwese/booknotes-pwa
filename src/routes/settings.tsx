import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { exportService, type ImportStrategy } from '../services/exportService'
import { useApiSettings } from '../hooks/useApiSettings'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [importResult, setImportResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null)
  const [importStrategy, setImportStrategy] = useState<ImportStrategy>('merge')
  const [showImportConfirm, setShowImportConfirm] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleExportJSON = async () => {
    setIsExporting(true)
    try {
      await exportService.exportToJSON()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleExportZIP = async () => {
    setIsExporting(true)
    try {
      await exportService.exportToZIP()
    } catch (error) {
      console.error('Export failed:', error)
    } finally {
      setIsExporting(false)
    }
  }

  const handleImportClick = () => {
    if (!selectedFile) return
    setShowImportConfirm(true)
  }

  const confirmImport = async () => {
    if (!selectedFile) return
    setIsImporting(true)
    setShowImportConfirm(false)

    try {
      let result
      if (selectedFile.name.endsWith('.zip')) {
        result = await exportService.importFromZIP(selectedFile, importStrategy)
      } else {
        result = await exportService.importFromJSON(selectedFile, importStrategy)
      }
      setImportResult(result)
      queryClient.invalidateQueries({ queryKey: ['books', 'all'] })
      queryClient.invalidateQueries({ queryKey: ['book'] })
    } catch (error) {
      console.error('Import failed:', error)
      setImportResult({
        imported: 0,
        skipped: 0,
        errors: [String(error)]
      })
    } finally {
      setIsImporting(false)
      setSelectedFile(null)
    }
  }

  return (
    <div className="settings-page" style={{ padding: 16 }}>
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 24 }}>Settings</h1>

      {/* API Settings */}
      <ApiSettingsSection />

      {/* Export Section */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Export Data</h3>
        <p style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6, marginBottom: 16 }}>
          Export your book collection for backup or transfer.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={handleExportZIP}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export with Covers'}
          </button>
        </div>
      </div>

      {/* Import Section */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Import Data</h3>
        <div className="form-group">
          <label className="form-label">Select file (JSON or ZIP)</label>
          <input
            type="file"
            accept=".json,.zip"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="form-input"
          />
        </div>

        {selectedFile && (
          <div className="form-group">
            <label className="form-label">Import Strategy</label>
            <select
              value={importStrategy}
              onChange={(e) => setImportStrategy(e.target.value as ImportStrategy)}
              className="form-input"
            >
              <option value="merge">Merge (update existing, add new)</option>
              <option value="keepExisting">Keep Existing</option>
              <option value="keepBoth">Keep Both (create copies)</option>
            </select>
          </div>
        )}

        <button
          type="button"
          className="btn btn--primary"
          onClick={handleImportClick}
          disabled={!selectedFile || isImporting}
          style={{ marginTop: 8 }}
        >
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className="card" style={{ padding: 16 }}>
          <h3 style={{ margin: '0 0 16px 0' }}>Import Result</h3>
          <div style={{ marginBottom: 12 }}>
            <strong>{importResult.imported}</strong> items imported,{' '}
            <strong>{importResult.skipped}</strong> skipped
          </div>
          {importResult.errors.length > 0 && (
            <div style={{ color: '#ef4444', fontSize: 14 }}>
              <strong>Errors:</strong>
              <ul style={{ margin: '8px 0', paddingLeft: 20 }}>
                {importResult.errors.map((error, i) => (
                  <li key={i}>{error}</li>
                ))}
              </ul>
            </div>
          )}
          <button type="button" className="btn btn--secondary" onClick={() => setImportResult(null)}>
            Dismiss
          </button>
        </div>
      )}

      {/* Confirmation Modal */}
      {showImportConfirm && (
        <div className="modal-overlay" onClick={() => setShowImportConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
            <h3 style={{ margin: '0 0 16px 0' }}>Confirm Import</h3>
            <p>
              This will import data from <strong>{selectedFile?.name}</strong>.
              <br /><br />
              Strategy: <strong>{importStrategy}</strong>
            </p>
            <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
              <button type="button" className="btn btn--primary" onClick={confirmImport}>Import</button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowImportConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* About Section */}
      <div className="card" style={{ padding: 16, marginTop: 24 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>About</h3>
        <p style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6 }}>
          BookNotes PWA v1.0<br />
          A progressive web app for managing your book collection.
        </p>
      </div>
    </div>
  )
}

function ApiSettingsSection() {
  const { proxyUrl, apiKey, setProxyUrl, setApiKey, resetToDefaults } = useApiSettings()
  const [status, setStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle')
  const [testMessage, setTestMessage] = useState('')

  const testConnection = async () => {
    setStatus('testing')
    setTestMessage('Testing connection...')

    try {
      const url = `${proxyUrl}/isbn/9780451524935?source=google`
      const response = await fetch(url, {
        headers: { 'X-API-Key': apiKey }
      })

      if (response.ok || response.status === 404) {
        setStatus('success')
        setTestMessage('Connection successful!')
      } else {
        setStatus('error')
        setTestMessage(`Connection failed (status: ${response.status})`)
      }
    } catch {
      setStatus('error')
      setTestMessage('Connection failed - check URL')
    }
  }

  return (
    <div className="card" style={{ padding: 16, marginBottom: 16 }}>
      <h3 style={{ margin: '0 0 16px 0' }}>API Settings</h3>
      <p style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6, marginBottom: 16 }}>
        Configure the Cloudflare Worker proxy for ISBN lookups. Get your worker URL from your Cloudflare dashboard.
      </p>

      <div className="form-group">
        <label className="form-label">Proxy URL</label>
        <input
          type="url"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">API Key (optional)</label>
        <input
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your worker API key"
          className="form-input"
        />
      </div>

      <div style={{ display: 'flex', gap: 8, marginTop: 8, alignItems: 'center' }}>
        <button type="button" className="btn btn--secondary" onClick={testConnection} disabled={status === 'testing'}>
          {status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
        <button type="button" className="btn btn--secondary" onClick={resetToDefaults}>
          Reset to Default
        </button>
      </div>

      {status !== 'idle' && (
        <p style={{
          marginTop: 12,
          fontSize: 14,
          color: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--app-text)'
        }}>
          {testMessage}
        </p>
      )}
    </div>
  )
}
