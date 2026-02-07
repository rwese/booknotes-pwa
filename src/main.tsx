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
      // Clean the path and navigate
      const cleanPath = decodeURIComponent(redirectPath)
      navigate({ to: cleanPath, replace: true })
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
