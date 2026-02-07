import { createRootRoute, createRoute, createRouter, Outlet, Navigate } from '@tanstack/react-router'
import App from './App'
import { BookForm } from './components/books/BookForm'
import { BookDetail } from './components/books/BookDetail'
import { ISBNScanner } from './components/scanner/ISBNScanner'
import { AnalyticsPage } from './routes/analytics'
import { SettingsPage } from './routes/settings'
import { BooksIndex } from './routes/books'

// Base path for GitHub Pages deployment - exported for use in other components
export const BASE_PATH = '/booknotes-pwa'

// Root layout route with loader to handle redirects from 404.html
const RootRoute = createRootRoute({
  loader: () => {
    // Check for sessionStorage redirect from 404.html (new approach)
    const redirectRoute = sessionStorage.getItem('spa-redirect')
    if (redirectRoute) {
      sessionStorage.removeItem('spa-redirect')
      // Throw redirect to be handled by router
      throw new Response(null, {
        status: 302,
        headers: { Location: redirectRoute }
      })
    }

    // Legacy fallback: handle old ?r= query param for users with cached 404.html
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirectPath = params.get('r')
      if (redirectPath) {
        const cleanPath = decodeURIComponent(redirectPath)
        // Clean the URL by replacing state
        window.history.replaceState({}, '', `${BASE_PATH}${cleanPath}`)
        throw new Response(null, {
          status: 302,
          headers: { Location: cleanPath }
        })
      }
    }

    return null
  },
  component: () => (
    <App />
  )
})

// Index route - redirect to books
const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: () => <Navigate to="/books" replace />
})

// Books routes
const booksRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'books',
  component: () => <Outlet />
})

const booksIndexRoute = createRoute({
  getParentRoute: () => booksRoute,
  path: '/',
  component: () => <BooksIndex />
})

// Book detail route - accepts both slug and UUID
const bookDetailRoute = createRoute({
  getParentRoute: () => booksRoute,
  path: '$bookSlug',
  component: () => <BookDetail />
})

// Book edit route - accepts both slug and UUID
const bookEditRoute = createRoute({
  getParentRoute: () => booksRoute,
  path: '$bookSlug/edit',
  component: () => <BookForm mode="edit" />
})

const bookNewRoute = createRoute({
  getParentRoute: () => booksRoute,
  path: 'new',
  component: () => <BookForm mode="create" />
})

// Analytics route
const analyticsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'analytics',
  component: () => <AnalyticsPage />
})

// Scanner route
const scannerRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'scanner',
  component: () => <ISBNScanner />
})

// Settings route
const settingsRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'settings',
  component: () => <SettingsPage />
})

const routeTree = RootRoute.addChildren([
  IndexRoute,
  booksRoute.addChildren([booksIndexRoute, bookDetailRoute, bookEditRoute, bookNewRoute]),
  analyticsRoute,
  scannerRoute,
  settingsRoute
])

export { routeTree }

export const router = createRouter({
  routeTree,
  basepath: BASE_PATH
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
