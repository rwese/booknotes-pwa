import { defineConfig, type UserConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'node:fs'
import path from 'node:path'

const isGitHubPages = process.env.GITHUB_PAGES === 'true'

// Cache busting version - update this when breaking changes require cache invalidation
const CACHE_BUST_VERSION = '0.12.0'

// Plugin to generate version.json in the build output
function versionJsonPlugin(): Plugin {
  return {
    name: 'version-json',
    writeBundle(options) {
      const outDir = options.dir || 'dist'
      const versionData = JSON.stringify({ version: CACHE_BUST_VERSION, timestamp: Date.now() })
      fs.writeFileSync(path.resolve(outDir, 'version.json'), versionData)
    }
  }
}

// Plugin to transform static asset paths in index.html for GitHub Pages
function basePathTransformer(): Plugin {
  return {
    name: 'base-path-transformer',
    transformIndexHtml(html) {
      if (!isGitHubPages) return html

      // Transform relative paths to use base path
      const basePath = '/booknotes-pwa/'
      return html
        .replace(/href="manifest\.webmanifest"/g, `href="${basePath}manifest.webmanifest"`)
        .replace(/href="icons\//g, `href="${basePath}icons/`)
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: isGitHubPages ? '/booknotes-pwa' : '/',
  build: {
    // Content hashing for cache busting
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name]-[hash].js',
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      }
    }
  },
  plugins: [
    versionJsonPlugin(),
    basePathTransformer(),
    // SPA fallback for vite preview: rewrite non-file URLs to index.html
    {
      name: 'spa-fallback-preview',
      configurePreviewServer(server) {
        server.middlewares.use((req, _res, next) => {
          if (req.url && !req.url.includes('.') && !req.url.endsWith('/')) {
            const basePath = isGitHubPages ? '/booknotes-pwa/' : '/'
            const outDir = path.resolve(__dirname, 'dist')
            const indexPath = path.join(outDir, 'index.html')
            if (req.url.startsWith(basePath) && fs.existsSync(indexPath)) {
              req.url = basePath + 'index.html'
            }
          }
          next()
        })
      },
    },
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      injectRegister: false,
      devOptions: {
        enabled: false
      },
      manifest: {
        name: 'BookNotes',
        short_name: 'BookNotes',
        description: 'Track your book reading progress',
        theme_color: '#1a1a2e',
        background_color: '#1a1a2e',
        display: 'standalone',
        orientation: 'portrait',
        scope: isGitHubPages ? '/booknotes-pwa/' : '/',
        start_url: isGitHubPages ? '/booknotes-pwa/' : '/',
        // @ts-expect-error version is used for cache busting, not part of standard manifest
        version: CACHE_BUST_VERSION,
        icons: [
          {
            src: 'icons/apple-icon-180.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/favicon-196.png',
            sizes: '196x196',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/favicon-32.png',
            sizes: '32x32',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/favicon-16.png',
            sizes: '16x16',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'icons/manifest-icon-192.maskable.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'icons/manifest-icon-512.maskable.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Aggressive cache cleanup on update
        cleanupOutdatedCaches: true,
        // Skip waiting to activate new service worker immediately
        skipWaiting: true,
        // Claim clients to start controlling pages immediately
        clientsClaim: true,
        // Navigate fallback for offline support
        navigateFallback: '/404.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          // API responses - StaleWhileRevalidate for fresh data
          {
            urlPattern: /^https:\/\/api\.openlibrary\.org\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'api-responses',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/booknotes-api\..*\.workers\.dev\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'booknotes-api',
              expiration: {
                maxEntries: 30,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          // Existing image caching
          {
            urlPattern: /^https:\/\/covers\.openlibrary\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'cover-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/books\.google\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-books-images',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 7 days
              }
            }
          }
        ]
      }
    })
  ]
} satisfies UserConfig)
