import { useState, useEffect, useCallback } from 'react'
import { useLocation } from '@tanstack/react-router'
import { BASE_PATH } from '../config'

const STORAGE_KEY = 'app-version'

interface VersionInfo {
  version: string
  timestamp: number
}

export function useVersionCheck() {
  const [updateAvailable, setUpdateAvailable] = useState(false)
  const [newVersion, setNewVersion] = useState<string | null>(null)
  const location = useLocation()

  const checkVersion = useCallback(async () => {
    try {
      // Fetch version.json with cache-busting query param
      const res = await fetch(`${BASE_PATH}/version.json?_=${Date.now()}`, {
        cache: 'no-store'
      })
      if (!res.ok) return

      const remote: VersionInfo = await res.json()
      const storedVersion = localStorage.getItem(STORAGE_KEY)

      if (!storedVersion) {
        // First visit — store current version, no banner
        localStorage.setItem(STORAGE_KEY, remote.version)
        return
      }

      if (storedVersion !== remote.version) {
        setUpdateAvailable(true)
        setNewVersion(remote.version)
      }
    } catch {
      // Network error — silently ignore
    }
  }, [])

  // Check on every route change
  const pathname = location.pathname
  useEffect(() => {
    checkVersion()
  }, [pathname, checkVersion])

  const refresh = useCallback(() => {
    if (newVersion) {
      localStorage.setItem(STORAGE_KEY, newVersion)
    }
    // Clear service worker caches then hard reload
    const hasCaches = 'caches' in window
    if (hasCaches) {
      void caches.keys().then(names => {
        void Promise.all(names.map(name => caches.delete(name))).then(() => {
          window.location.reload()
        })
      })
    } else {
      window.location.reload()
    }
  }, [newVersion])

  const dismiss = useCallback(() => {
    setUpdateAvailable(false)
  }, [])

  return { updateAvailable, newVersion, refresh, dismiss }
}
