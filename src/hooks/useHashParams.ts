import { useState, useEffect, useCallback } from 'react'

interface HashParams {
  [key: string]: string
}

export function useHashParams() {
  const [params, setParams] = useState<HashParams>({})

  // Parse hash into params object
  const parseHash = useCallback((hash: string): HashParams => {
    if (!hash || hash === '#') return {}
    const queryString = hash.slice(1) // Remove leading '#'
    const result: HashParams = {}
    queryString.split('&').forEach(pair => {
      const [key, value] = pair.split('=')
      if (key) {
        result[decodeURIComponent(key)] = decodeURIComponent(value || '')
      }
    })
    return result
  }, [])

  // Serialize params object into hash string
  const stringifyParams = useCallback((params: HashParams): string => {
    const pairs = Object.entries(params)
      .filter(([, value]) => value !== '' && value !== undefined)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    return pairs.length > 0 ? `#${pairs.join('&')}` : ''
  }, [])

  // Initialize from current hash on mount
  useEffect(() => {
    setParams(parseHash(window.location.hash))
  }, [parseHash])

  // Listen for hash changes
  useEffect(() => {
    const handleHashChange = () => {
      setParams(parseHash(window.location.hash))
    }
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [parseHash])

  // Set params (merges with existing)
  const setHashParams = useCallback((newParams: HashParams) => {
    const currentParams = parseHash(window.location.hash)
    const mergedParams = { ...currentParams, ...newParams }
    const newHash = stringifyParams(mergedParams)
    window.location.hash = newHash
  }, [parseHash, stringifyParams])

  // Clear all params
  const clearParams = useCallback(() => {
    window.location.hash = ''
    setParams({})
  }, [])

  return {
    params,
    setParams: setHashParams,
    clearParams
  }
}
