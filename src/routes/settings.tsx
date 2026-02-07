import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { exportService, type ImportStrategy } from '../services/exportService'
import { useApiSettings } from '../hooks/useApiSettings'
import {
  partialCacheInvalidation,
  checkForUpdates,
  registerServiceWorker
} from '../utils/cacheInvalidation'

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
      let result: { imported: number; skipped: number; errors: string[] }
      if (selectedFile!.name.endsWith('.zip')) {
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
    <div className="settings-page p-4">
      <h1 className="text-2xl font-semibold mb-6">Settings</h1>

      {/* API Settings */}
      <ApiSettingsSection />

      {/* Export Section */}
      <div className="card p-4 mb-4">
        <h2 className="m-0 mb-4">Export Data</h2>
        <p className="text-sm text-[var(--text-primary)] opacity-60 mb-4">
          Export your book collection for backup or transfer.
        </p>
        <div className="flex gap-3 flex-wrap">
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
      <div className="card p-4 mb-4">
        <h2 className="m-0 mb-4">Import Data</h2>
        <div className="form-group">
          <label className="form-label" htmlFor="import-file">Select file (JSON or ZIP)</label>
          <input
            id="import-file"
            type="file"
            accept=".json,.zip"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="form-input"
          />
        </div>

        {selectedFile && (
          <div className="form-group">
            <label className="form-label" htmlFor="import-strategy">Import Strategy</label>
            <select
              id="import-strategy"
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
          className="btn btn--primary mt-2"
          onClick={handleImportClick}
          disabled={!selectedFile || isImporting}
        >
          {isImporting ? 'Importing...' : 'Import'}
        </button>
      </div>

      {/* Import Result */}
      {importResult && (
        <div className="card p-4">
          <h2 className="m-0 mb-4">Import Result</h2>
          <div className="mb-3">
            <strong>{importResult.imported}</strong> items imported,{' '}
            <strong>{importResult.skipped}</strong> skipped
          </div>
          {importResult.errors.length > 0 && (
            <div className="text-[#ef4444] text-sm">
              <strong>Errors:</strong>
              <ul className="m-2 pl-5">
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
          <div className="modal-content max-w-md" onClick={(e) => e.stopPropagation()}>
            <h2 className="m-0 mb-4">Confirm Import</h2>
            <p>
              This will import data from <strong>{selectedFile?.name}</strong>.
              <br /><br />
              Strategy: <strong>{importStrategy}</strong>
            </p>
            <div className="flex gap-2 mt-4">
              <button type="button" className="btn btn--primary" onClick={confirmImport}>Import</button>
              <button type="button" className="btn btn--secondary" onClick={() => setShowImportConfirm(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Cache Management Section */}
      <div className="card p-4 mb-4">
        <h2 className="m-0 mb-4">Cache Management</h2>
        <p className="text-sm text-[var(--text-primary)] opacity-60 mb-4">
          Clear cached data to fix update issues. Use "Clear App Data" for complete reset.
        </p>

        <div className="flex gap-3 flex-wrap mb-4">
          <button
            type="button"
            className="btn btn--secondary"
            onClick={async () => {
              const hasUpdate = await checkForUpdates()
              if (!hasUpdate) {
                await registerServiceWorker()
              }
            }}
          >
            Check for Updates
          </button>
          <button
            type="button"
            className="btn btn--secondary"
            onClick={async () => {
              await partialCacheInvalidation()
            }}
          >
            Clear Runtime Cache
          </button>
        </div>

        <button
          type="button"
          className="btn btn--warning"
          onClick={async () => {
            if (confirm('This will clear all cached data and reload the app. Your books will be preserved. Continue?')) {
              await partialCacheInvalidation()
            }
          }}
        >
          Clear App Data
        </button>
      </div>

      {/* About Section */}
      <div className="card p-4 mt-6">
        <h2 className="m-0 mb-2">About</h2>
        <p className="text-sm text-[var(--text-primary)] opacity-60">
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

      // Use a more robust fetch with Safari-compatible settings
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s timeout

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'X-API-Key': apiKey,
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        signal: controller.signal,
        // Bypass service worker for direct API call
        cache: 'no-store'
      })

      clearTimeout(timeoutId)

      // Accept various success indicators
      if (response.ok || response.status === 401 || response.status === 404) {
        // 401 = unauthorized (API is reachable, just needs valid key)
        // 404 = not found (API is reachable, ISBN might not exist)
        setStatus('success')
        setTestMessage('Connection successful!')
      } else {
        setStatus('error')
        setTestMessage(`Connection failed (status: ${response.status})`)
      }
    } catch (error) {
      setStatus('error')
      if (error instanceof Error && error.name === 'AbortError') {
        setTestMessage('Connection timed out')
      } else {
        setTestMessage('Connection failed - check URL/network')
      }
      console.error('Connection test failed:', error)
    }
  }

  return (
    <div className="card p-4 mb-4">
      <h2 className="m-0 mb-4">API Settings</h2>
      <p className="text-sm text-[var(--text-primary)] opacity-60 mb-4">
        Configure the Cloudflare Worker proxy for ISBN lookups. Get your worker URL from your Cloudflare dashboard.
      </p>

      <div className="form-group">
        <label className="form-label" htmlFor="proxy-url">Proxy URL</label>
        <input
          id="proxy-url"
          type="url"
          value={proxyUrl}
          onChange={(e) => setProxyUrl(e.target.value)}
          placeholder="https://your-worker.workers.dev"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label" htmlFor="api-key">API Key (optional)</label>
        <input
          id="api-key"
          type="password"
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          placeholder="Your worker API key"
          className="form-input"
        />
      </div>

      <div className="flex gap-2 mt-2 items-center">
        <button type="button" className="btn btn--secondary" onClick={testConnection} disabled={status === 'testing'}>
          {status === 'testing' ? 'Testing...' : 'Test Connection'}
        </button>
        <button type="button" className="btn btn--secondary" onClick={resetToDefaults}>
          Reset to Default
        </button>
      </div>

      {status !== 'idle' && (
        <p className="mt-3 text-sm" style={{
          color: status === 'success' ? '#22c55e' : status === 'error' ? '#ef4444' : 'var(--text-primary)'
        }}>
          {testMessage}
        </p>
      )}
    </div>
  )
}
