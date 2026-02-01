import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { exportService, type ImportStrategy } from '../services/exportService'
import { useOfflineStatus } from '../hooks/useOfflineStatus'

export function SettingsPage() {
  const queryClient = useQueryClient()
  const isOffline = useOfflineStatus()
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

      {/* Offline Status */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 8px 0' }}>Status</h3>
        {isOffline ? (
          <span style={{ color: '#f59e0b' }}>You are currently offline</span>
        ) : (
          <span style={{ color: '#22c55e' }}>Online</span>
        )}
      </div>

      {/* Export Section */}
      <div className="card" style={{ padding: 16, marginBottom: 16 }}>
        <h3 style={{ margin: '0 0 16px 0' }}>Export Data</h3>
        <p style={{ fontSize: 14, color: 'var(--app-text)', opacity: 0.6, marginBottom: 16 }}>
          Export your book collection for backup or transfer.
        </p>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <button
            className="btn btn-primary"
            onClick={handleExportJSON}
            disabled={isExporting}
          >
            {isExporting ? 'Exporting...' : 'Export JSON'}
          </button>
          <button
            className="btn btn-secondary"
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
          className="btn btn-primary"
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
          <button className="btn btn-secondary" onClick={() => setImportResult(null)}>
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
              <button className="btn btn-primary" onClick={confirmImport}>Import</button>
              <button className="btn btn-secondary" onClick={() => setShowImportConfirm(false)}>Cancel</button>
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
