/**
 * Cache Invalidation Utilities for BookNotes PWA
 *
 * Provides utilities for managing browser cache, service worker updates,
 * and IndexedDB data clearing. Use these to ensure users get fresh data
 * after releases or when troubleshooting cache issues.
 */

import { liveQuery } from 'dexie'
import { db } from '../db/schema'

/**
 * Service Worker Registration
 */
let swRegistration: ServiceWorkerRegistration | null = null

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if ('serviceWorker' in navigator) {
    try {
      swRegistration = await navigator.serviceWorker.register('/sw.js')
      console.log('Service Worker registered:', swRegistration)
      return swRegistration
    } catch (error) {
      console.error('Service Worker registration failed:', error)
      return null
    }
  }
  return null
}

/**
 * Check if a new service worker is waiting to be activated
 */
export async function getWaitingServiceWorker(): Promise<ServiceWorker | null> {
  if (!swRegistration) {
    swRegistration = await navigator.serviceWorker.getRegistration()
  }
  return swRegistration?.waiting || null
}

/**
 * Skip waiting and activate the new service worker immediately
 */
export async function activateWaitingServiceWorker(): Promise<void> {
  const waitingSw = await getWaitingServiceWorker()
  if (waitingSw) {
    waitingSw.postMessage({ type: 'SKIP_WAITING' })
    // Reload the page after a short delay to ensure the new SW takes effect
    setTimeout(() => {
      window.location.reload()
    }, 100)
  }
}

/**
 * Check for service worker updates and notify the user
 */
export async function checkForUpdates(): Promise<boolean> {
  if (!swRegistration) {
    await registerServiceWorker()
  }

  return new Promise((resolve) => {
    if (!swRegistration) {
      resolve(false)
      return
    }

    swRegistration.addEventListener('updatefound', () => {
      const newSw = swRegistration?.installing
      if (newSw) {
        newSw.addEventListener('statechange', () => {
          if (newSw.state === 'installed' && navigator.serviceWorker.controller) {
            // New content is available
            resolve(true)
          }
        })
      }
    })

    // Check immediately
    swRegistration.update()

    // Timeout after 5 seconds
    setTimeout(() => resolve(false), 5000)
  })
}

/**
 * Clear all service worker caches
 */
export async function clearServiceWorkerCaches(): Promise<void> {
  try {
    const cacheNames = await caches.keys()
    await Promise.all(cacheNames.map(cacheName => caches.delete(cacheName)))
    console.log('Service worker caches cleared:', cacheNames)
  } catch (error) {
    console.error('Failed to clear service worker caches:', error)
  }
}

/**
 * Clear IndexedDB database
 */
export async function clearIndexedDB(): Promise<void> {
  try {
    await db.delete()
    console.log('IndexedDB cleared')
  } catch (error) {
    console.error('Failed to clear IndexedDB:', error)
  }
}

/**
 * Clear all localStorage items
 */
export function clearLocalStorage(): void {
  try {
    localStorage.clear()
    console.log('LocalStorage cleared')
  } catch (error) {
    console.error('Failed to clear localStorage:', error)
  }
}

/**
 * Clear TanStack Query cache
 */
export function clearQueryCache(queryClient: import('@tanstack/react-query').QueryClient): void {
  try {
    queryClient.clear()
    console.log('TanStack Query cache cleared')
  } catch (error) {
    console.error('Failed to clear Query cache:', error)
  }
}

/**
 * Complete cache invalidation - clears all storage layers
 * Use this after major updates to ensure fresh state
 */
export async function fullCacheInvalidation(
  queryClient: import('@tanstack/react-query').QueryClient
): Promise<void> {
  console.log('Starting full cache invalidation...')

  // 1. Clear service worker and caches
  await clearServiceWorkerCaches()

  // 2. Clear IndexedDB
  await clearIndexedDB()

  // 3. Clear localStorage
  clearLocalStorage()

  // 4. Clear TanStack Query cache
  clearQueryCache(queryClient)

  // 5. Reload to apply changes
  setTimeout(() => {
    window.location.reload()
  }, 500)

  console.log('Full cache invalidation complete')
}

/**
 * Partial cache invalidation - only clears runtime caches
 * Use this for routine updates without clearing user data
 */
export async function partialCacheInvalidation(): Promise<void> {
  console.log('Starting partial cache invalidation...')

  // Clear service worker caches (keeps IndexedDB)
  await clearServiceWorkerCaches()

  console.log('Partial cache invalidation complete')
}

/**
 * Get current app version from manifest
 */
export async function getAppVersion(): Promise<string | null> {
  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration?.active) {
      // Try to get version from the SW scope
      return null
    }
    return null
  } catch {
    return null
  }
}

/**
 * Listen for service worker messages
 */
export function setupServiceWorkerListener(): void {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data.type === 'CACHE_UPDATED') {
        console.log('Cache updated:', event.data.payload)
      }
    })
  }
}

/**
 * Force refresh from network (bypass all caches)
 */
export function forceNetworkRefresh(): void {
  // Add cache-busting query parameter
  window.location.href = window.location.pathname + '?t=' + Date.now()
}
