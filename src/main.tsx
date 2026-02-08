import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
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

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
