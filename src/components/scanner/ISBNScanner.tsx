import { useState, useEffect, useRef, useCallback } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { useNavigate } from '@tanstack/react-router'
import './ISBNScanner.css'

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
      <h1 className="text-2xl font-semibold mb-4">Scan ISBN</h1>

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
          <p className="text-red-600 m-0">{error}</p>
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
          <div className="mb-6">
            <button
              type="button"
              className="btn btn--primary w-full py-4 text-lg"
              onClick={startScanning}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="mr-2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2" />
                <path d="M17 3h2a2 2 0 0 1 2 2v2" />
                <path d="M21 17v2a2 2 0 0 1-2 2h-2" />
                <path d="M7 21H5a2 2 0 0 1-2-2v-2" />
                <line x1="7" y1="12" x2="17" y2="12" />
              </svg>
              Start Camera Scanner
            </button>
            <p className="text-sm text-[var(--text-primary)] opacity-60 mt-2 text-center">
              Point your camera at a book barcode (ISBN)
            </p>
          </div>

          <div className="border-t border-[var(--border)] pt-6">
            <h2 className="text-base font-semibold mb-3">Or enter ISBN manually</h2>
            <form onSubmit={handleManualSubmit} className="flex gap-2">
              <input
                type="text"
                value={manualISBN}
                onChange={(e) => setManualISBN(e.target.value)}
                placeholder="Enter ISBN (10 or 13 digits)"
                className="form-input flex-1"
              />
              <button type="submit" className="btn btn--secondary">Go</button>
            </form>
          </div>

          {lastScanned && (
            <div className="mt-6 p-3 bg-green-50 rounded-lg">
              <p className="text-green-700 m-0 text-sm">
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
    <div className="scanner-view relative">
      <div
        id={scannerId}
        className="w-full max-w-md mx-auto rounded-lg overflow-hidden bg-black"
        style={{
          width: '100%',
          maxWidth: 400,
          margin: '0 auto',
          borderRadius: 8,
          overflow: 'hidden',
          backgroundColor: '#000'
        }}
      />

      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[250px] h-[150px] border-2 border-[var(--primary)] rounded-lg pointer-events-none">
        <div className="absolute left-0 right-0 h-0.5 bg-[var(--primary)] animate-[scan_2s_ease-in-out_infinite]" />
      </div>

      <button type="button" className="btn btn--secondary mt-4 w-full" onClick={onClose}>Cancel</button>
    </div>
  )
}
