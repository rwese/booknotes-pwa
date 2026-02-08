import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import * as Sentry from '@sentry/react'
import router from './router'
import './index.css'

// PWA Service Worker registration - use base path for GitHub Pages
const SW_BASE_PATH = '/booknotes-pwa'

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    const scope = SW_BASE_PATH + '/'
    navigator.serviceWorker
      .register(`${scope}sw.js`, { scope })
      .then((registration) => {
        console.log('SW registered:', registration.scope)
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // New content available, prompt user to refresh
                console.log('New content available, refresh to update')
              }
            })
          }
        })
      })
      .catch((error) => {
        console.log('SW registration failed:', error)
      })
  })
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

// Initialize Sentry for error tracking and performance monitoring
Sentry.init({
  dsn: 'https://dbb65c15b4209e7a3083644c515c10c7@o4510849603731456.ingest.de.sentry.io/4510849744896080',
  sendDefaultPii: true,
  enableLogs: true,
  integrations: [
    Sentry.consoleLoggingIntegration({ levels: ['log', 'warn', 'error'] })
  ]
})

const container = document.getElementById('root')!
const root = createRoot(container)
root.render(
  <StrictMode>
    <Sentry.ErrorBoundary fallback={({ error, resetError }) => (
      <div className="error-fallback">
        <h2>Something went wrong</h2>
        <p>{error instanceof Error ? error.message : 'Unknown error'}</p>
        <button type="button" onClick={resetError}>Try again</button>
      </div>
    )}>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    </Sentry.ErrorBoundary>
  </StrictMode>
)
