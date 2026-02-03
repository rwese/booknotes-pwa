import { useState, useEffect, useCallback } from 'react'

export interface ApiSettings {
  proxyUrl: string
  apiKey: string
}

const STORAGE_KEY = 'booknotes-api-settings'

const DEFAULT_PROXY_URL = import.meta.env.VITE_PROXY_URL || 'https://booknotes-proxy.your-subdomain.workers.dev'

export function useApiSettings() {
  const [settings, setSettingsState] = useState<ApiSettings>(() => {
    if (typeof window === 'undefined') {
      return { proxyUrl: DEFAULT_PROXY_URL, apiKey: '' }
    }
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return {
          proxyUrl: parsed.proxyUrl || DEFAULT_PROXY_URL,
          apiKey: parsed.apiKey || ''
        }
      }
    } catch {
      // Ignore parse errors
    }
    return { proxyUrl: DEFAULT_PROXY_URL, apiKey: '' }
  })

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
    } catch {
      // Ignore storage errors
    }
  }, [settings])

  const setProxyUrl = useCallback((url: string) => {
    setSettingsState(prev => ({ ...prev, proxyUrl: url }))
  }, [])

  const setApiKey = useCallback((key: string) => {
    setSettingsState(prev => ({ ...prev, apiKey: key }))
  }, [])

  const updateSettings = useCallback((newSettings: Partial<ApiSettings>) => {
    setSettingsState(prev => ({ ...prev, ...newSettings }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setSettingsState({ proxyUrl: DEFAULT_PROXY_URL, apiKey: '' })
  }, [])

  return {
    ...settings,
    setProxyUrl,
    setApiKey,
    updateSettings,
    resetToDefaults
  }
}

export function getApiConfig() {
  if (typeof window === 'undefined') {
    return {
      proxyBaseUrl: DEFAULT_PROXY_URL,
      apiKey: ''
    }
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      return {
        proxyBaseUrl: parsed.proxyUrl || DEFAULT_PROXY_URL,
        apiKey: parsed.apiKey || ''
      }
    }
  } catch {
    // Ignore parse errors
  }

  return {
    proxyBaseUrl: DEFAULT_PROXY_URL,
    apiKey: ''
  }
}
