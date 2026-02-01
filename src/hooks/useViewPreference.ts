import { useState, useEffect, useCallback } from 'react'

export type ViewMode = 'list' | 'grid'

const STORAGE_KEY = 'booknotes-view-preference'

export function useViewPreference(defaultMode: ViewMode = 'list'): [ViewMode, (mode: ViewMode) => void] {
  const [viewMode, setViewModeState] = useState<ViewMode>(() => {
    if (typeof window === 'undefined') return defaultMode
    const stored = localStorage.getItem(STORAGE_KEY)
    return (stored === 'list' || stored === 'grid') ? stored : defaultMode
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, viewMode)
  }, [viewMode])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeState(mode)
  }, [])

  return [viewMode, setViewMode]
}
