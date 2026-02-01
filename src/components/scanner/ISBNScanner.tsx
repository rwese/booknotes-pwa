import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from '@tanstack/react-router'

export function ISBNScanner() {
  const navigate = useNavigate()
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualISBN, setManualISBN] = useState('')
  const [lastScanned, setLastScanned] = useState<string | null>(null)

  const handleScan = useCallback((isbn: string) => {
    setLastScanned(isbn)
    setError(null)
    navigate({ to: '/books/new', search: { isbn } })
  }, [navigate])

  const startScanning = async () => {
    setError(null)
    setIsScanning(true)
  }

  const stopScanning = () => {
    setIsScanning(false)
  }

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (manualISBN.trim()) {
      handleScan(manualISBN.trim())
    }
  }

  return (
    <div className="isbn-scanner">
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 16 }}>Scan ISBN</h1>

      {error && (
        <div style={{ padding: 12, backgroundColor: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, marginBottom: 16 }}>
          <p style={{ color: '#dc2626', margin: 0 }}>{error}</p>
        </div>
      )}

      {isScanning ? (
        <ScannerView
          onScan={handleScan}
          onError={setError}
          onClose={stopScanning}
        />
      ) : (
        <div className="scanner-options">
          <div style={{ marginBottom: 24 }}>
            <button
              className="btn btn-primary"
              onClick={startScanning}
              style={{ width: '100%', padding: '16px 24px', fontSize: 18 }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: 8 }}>
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
              Start Camera Scanner
            </button>
            <p style={{ fontSize: 12, color: 'var(--app-text)', opacity: 0.6, marginTop: 8, textAlign: 'center' }}>
              Point your camera at a book barcode (ISBN)
            </p>
          </div>

          <div style={{ borderTop: '1px solid var(--app-border)', paddingTop: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12 }}>Or enter ISBN manually</h3>
            <form onSubmit={handleManualSubmit} style={{ display: 'flex', gap: 8 }}>
              <input
                type="text"
                value={manualISBN}
                onChange={(e) => setManualISBN(e.target.value)}
                placeholder="Enter ISBN (10 or 13 digits)"
                className="form-input"
              />
              <button type="submit" className="btn btn-secondary">Go</button>
            </form>
          </div>

          {lastScanned && (
            <div style={{ marginTop: 24, padding: 12, backgroundColor: '#f0fdf4', borderRadius: 8 }}>
              <p style={{ color: '#16a34a', margin: 0, fontSize: 14 }}>
                Last scanned: <strong>{lastScanned}</strong>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

interface ScannerViewProps {
  onScan: (isbn: string) => void
  onError: (error: string | null) => void
  onClose: () => void
}

function ScannerView({ onScan, onError, onClose }: ScannerViewProps) {
  const scannerId = 'isbn-scanner-container'
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const startScanner = async () => {
      try {
        scannerRef.current = new Html5Qrcode(scannerId)

        await scannerRef.current.start(
          { facingMode: 'environment' },
          {
            fps: 10,
            qrbox: { width: 250, height: 150 },
            aspectRatio: 1.666
          },
          (decodedText) => {
            const cleanISBN = decodedText.replace(/[-\s]/g, '')
            if (cleanISBN.length === 10 || cleanISBN.length === 13) {
              onScan(cleanISBN)
            }
          },
          () => {}
        )
      } catch (err) {
        console.error('Scanner error:', err)
        onError('Failed to start camera. Please check permissions.')
        onClose()
      }
    }

    startScanner()

    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [onScan, onError, onClose])

  return (
    <div className="scanner-view" style={{ position: 'relative' }}>
      <div
        id={scannerId}
        style={{
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#000'
        }}
      />

      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 250, height: 150, border: '2px solid var(--app-primary)', borderRadius: 8, pointerEvents: 'none' }}>
        <div style={{ position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: 'var(--app-primary)', animation: 'scan 2s ease-in-out infinite' }} />
      </div>

      <style>{`
        @keyframes scan {
          0%, 100% { top: 0; }
          50% { top: 100%; }
        }
      `}</style>

      <button className="btn btn-secondary" onClick={onClose} style={{ marginTop: 16, width: '100%' }}>Cancel</button>
    </div>
  )
}
