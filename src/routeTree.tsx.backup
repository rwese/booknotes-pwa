import { createRootRoute, createRoute, createRouter, Outlet, Navigate } from '@tanstack/react-router'
import { BookForm } from './components/books/BookForm'
import { BookDetail } from './components/books/BookDetail'
import { ISBNScanner } from './components/scanner/ISBNScanner'
import { AnalyticsPage } from './routes/analytics'
import { SettingsPage } from './routes/settings'
import { BooksIndex } from './routes/books'
import { BASE_PATH } from './config'
import { AppShell } from './components/AppShell'

// Root layout route
const RootRoute = createRootRoute({
  loader: () => {
    // Check for sessionStorage redirect from 404.html
    const redirectRoute = sessionStorage.getItem('spa-redirect')
    if (redirectRoute) {
      sessionStorage.removeItem('spa-redirect')
      throw new Response(null, {
        status: 302,
        headers: { Location: redirectRoute }
      })
    }

    // Legacy fallback: handle old ?r= query param
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      const redirectPath = params.get('r')
      if (redirectPath) {
        const cleanPath = decodeURIComponent(redirectPath)
        window.history.replaceState({}, '', `${BASE_PATH}${cleanPath}`)
        throw new Response(null, {
          status: 302,
          headers: { Location: cleanPath }
        })
      }
    }

    return null
  },
  component: () => <AppShell />
})

// Index route - redirect to books
const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: () => <Navigate to="/books" replace />
})

// Books routes - using flat structure with unique path segments
const booksRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: 'books',
  component: () => <Outlet />
})

const booksIndexRoute = createRoute({
  getParentRoute: () => booksRoute,
  path: '/',  // This should be '/' not '' for index
  component: () => <BooksIndex />
})

const bookDetailRoute = createRoute({
  getParentRoute: () => booksRoute,
  path: '$bookSlug',
  component: () => <BookDetail />
})

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

// Build route tree
const routeTree = RootRoute.addChildren([
  IndexRoute,
  booksRoute.addChildren([booksIndexRoute, bookDetailRoute, bookEditRoute, bookNewRoute]),
  analyticsRoute,
  scannerRoute,
  settingsRoute
])

// Create router
const router = createRouter({
  routeTree,
  basepath: BASE_PATH
})

export { routeTree, router }
