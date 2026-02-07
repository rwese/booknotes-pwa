# BookNotes PWA

A Progressive Web Application for tracking book reading progress with offline support.

## Technology Stack

- **React 19** - UI framework with concurrent features
- **TypeScript** - Type-safe development
- **TanStack Router** - Type-safe routing with file-based routing
- **TanStack Query** - Server state management with caching
- **Dexie.js** - IndexedDB wrapper for local data persistence
- **Vite** - Fast build tooling
- **vite-plugin-pwa** - PWA configuration with Workbox
- **Tailwind CSS** - Utility-first styling

## PWA Features

- **Offline Support**: Works without internet connection
- **Installable**: Add to home screen on mobile devices
- **Cache Busting**: Automatic and manual cache invalidation for releases
- **Service Worker**: Workbox-powered caching strategies

## Cache Invalidation

### Automatic Cache Busting

The app uses multiple cache invalidation strategies:

1. **Content Hashing**: Vite build appends content hashes to filenames
2. **Service Worker**: `skipWaiting` and `clientsClaim` enabled
3. **Manifest Versioning**: Version in `manifest.json` triggers updates
4. **Runtime Caching**: StaleWhileRevalidate for API responses

### Cache Bust Version

Located in `vite.config.ts`:

```typescript
const CACHE_BUST_VERSION = "1.0.1"
```

Increment this version for breaking changes to force all clients to update.

### Version Management Commands

Use npm scripts to manage versions:

```bash
# Patch version bump (1.0.1 -> 1.0.2) - for bug fixes
npm run version:patch

# Minor version bump (1.0.1 -> 1.1.0) - for new features
npm run version:minor

# Major version bump (1.0.1 -> 2.0.0) - for breaking changes
npm run version:major

# Show current version
npm run version

# Dry run - show what would change without modifying files
npm run version:dry-patch
npm run version:dry-minor
npm run version:dry-major
```

### Manual Cache Clearing

Users can clear caches via **Settings → Cache Management**:

- **Check for Updates**: Force service worker update check
- **Clear Runtime Cache**: Remove service worker caches
- **Clear App Data**: Complete cache invalidation (preserves books)

## Development

### Prerequisites

- Node.js 20+
- npm 10+

### Setup

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for GitHub Pages
npm run build:pages

# Preview production build
npm run preview:pages

# Run tests
npm run test

# Run acceptance tests
npm run test:acceptance
```

### Project Structure

```
src/
├── App.tsx                    # Root component with navigation
├── main.tsx                   # Entry point
├── routeTree.tsx             # TanStack Router configuration
├── routes/
│   ├── index.tsx             # Books list
│   ├── analytics.tsx         # Reading statistics
│   ├── scanner.tsx          # ISBN barcode scanner
│   └── settings.tsx         # App settings & export
├── components/
│   ├── books/               # Book-related components
│   └── ui/                  # Reusable UI components
├── hooks/
│   ├── useBooks.ts          # TanStack Query hooks
│   ├── useBookSearch.ts     # Book search functionality
│   ├── useApiSettings.ts    # API configuration
│   └── useViewPreference.ts # UI preferences
├── db/
│   ├── schema.ts            # Dexie database definition
│   └── repositories/        # Data access layer
├── services/
│   └── exportService.ts     # Import/export functionality
├── utils/
│   └── cacheInvalidation.ts  # Cache management utilities
└── index.css                # Global styles
```

## Deployment

### GitHub Pages

The app deploys automatically via GitHub Actions on push to `main`.

Manual deployment:

```bash
npm run build:pages
# Output in dist/ directory
```

### Cache Behavior

On new releases:

1. Vite generates hashed asset filenames
2. Service worker detects changes
3. `skipWaiting` activates new SW immediately
4. `clientsClaim` takes control of all clients
5. Old caches cleaned up automatically

### Troubleshooting Updates

If users report stale data after updates:

1. **Clear Runtime Cache**: Settings → Cache Management → Clear Runtime Cache
2. **Hard Refresh**: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
3. **Complete Reset**: Clear browser data for the site
