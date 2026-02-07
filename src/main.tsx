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
    // Check for sessionStorage redirect from 404.html (new approach)
    const redirectRoute = sessionStorage.getItem('spa-redirect')
    if (redirectRoute) {
      sessionStorage.removeItem('spa-redirect')
      // redirectRoute is the path after basePath, e.g. "/books/1q84-9780307593313"
      navigate({ to: redirectRoute, replace: true })
      return
    }

    // Legacy fallback: handle old ?r= query param for users with cached 404.html
    const params = new URLSearchParams(window.location.search)
    const redirectPath = params.get('r')
    if (redirectPath) {
      const cleanPath = decodeURIComponent(redirectPath)
      navigate({ to: cleanPath, replace: true })
      // Clean the URL
      window.history.replaceState({}, '', `/booknotes-pwa${cleanPath}`)
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
