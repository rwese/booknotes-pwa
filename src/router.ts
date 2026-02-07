import { createRouter } from '@tanstack/react-router'
import { routeTree } from './routeTree'
import App from './App'

// Create router instance
const router = createRouter({
  routeTree,
  basepath: '/booknotes-pwa'
})

// Register the router type
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

export { router, App }
