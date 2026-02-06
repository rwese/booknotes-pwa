import { createRootRoute, createRoute, createRouter, Outlet, Navigate } from '@tanstack/react-router'
import App from './App'
import { BookForm } from './components/books/BookForm'
import { BookDetail } from './components/books/BookDetail'
import { ISBNScanner } from './components/scanner/ISBNScanner'
import { AnalyticsPage } from './routes/analytics'
import { SettingsPage } from './routes/settings'
import { BooksIndex } from './routes/books'

const BASE = '/booky'

// Root layout route
const RootRoute = createRootRoute({
  component: () => (
    <App />
  )
})

// Index route - redirect to books
const IndexRoute = createRoute({
  getParentRoute: () => RootRoute,
  path: '/',
  component: () => <Navigate to="/books" />
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

export const router = createRouter({
  routeTree,
  // Strip base path from location for matching
  context: {
    basepath: BASE
  }
})

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}
