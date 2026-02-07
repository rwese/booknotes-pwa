import { createRootRoute, createRoute, Outlet, Navigate } from '@tanstack/react-router'
import App from './App'
import { BooksIndex } from './routes/books'
import { BookDetail } from './components/books/BookDetail'
import { BookForm } from './components/books/BookForm'
import { AnalyticsPage } from './routes/analytics'
import { SettingsPage } from './routes/settings'
import { ISBNScanner } from './components/scanner/ISBNScanner'

// Root layout - provides the app shell with TabBar
const RootRoute = createRootRoute({
  component: () => <App />
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

export { routeTree }
