import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider, useNavigate } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { router } from './routeTree'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
})

// Component to handle redirect from 404.html
function RedirectHandler() {
  const navigate = useNavigate()

  useEffect(() => {
    // Check for redirect parameter from 404.html
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('r')
    if (redirectPath) {
      // Clean the path and navigate, ensuring BASE_PATH is included
      const cleanPath = decodeURIComponent(redirectPath)
      const fullPath = cleanPath.startsWith('/booknotes-pwa') ? cleanPath : `/booknotes-pwa${cleanPath}`
      navigate({ to: fullPath, replace: true })

      // Also clean up the URL by removing the ?r= parameter to prevent users from being stuck
      // with old cached versions that keep redirecting
      window.history.replaceState({}, '', fullPath)
    }

    // Also clean up any malformed redirect URLs (e.g., ?r=%2Fbooks without base path)
    // This helps users stuck with cached old versions
    const currentPath = window.location.pathname
    if (!currentPath.includes('/booknotes-pwa') && params.get('r')) {
      const cleanPath = decodeURIComponent(params.get('r')!)
      const fullPath = `/booknotes-pwa${cleanPath}`
      window.history.replaceState({}, '', fullPath)
      navigate({ to: fullPath, replace: true })
    }
  }, [navigate])

  return null
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RedirectHandler />
      <RouterProvider router={router} />
    </QueryClientProvider>
  </StrictMode>
)
