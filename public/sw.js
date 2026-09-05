/**
 * TutorPulse Production-Ready Service Worker
 * Version: 1.0.0
 * 
 * SECURITY NOTICE:
 * This service worker NEVER caches sensitive data, private student records,
 * Supabase auth tokens, fees, parent details, or database query results.
 * Only static assets and the offline fallback page are cached.
 */

const CACHE_NAME = 'tutorpulse-v1'
const STATIC_ASSETS = [
  '/offline',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  '/icons/icon-maskable-192x192.png',
  '/icons/icon-maskable-512x512.png',
  '/icons/apple-touch-icon.png',
  '/favicon.ico',
]

// 1. Install Event: Cache essential app shell & offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS)
    }).then(() => {
      return self.skipWaiting()
    })
  )
})

// 2. Activate Event: Clean up old cache versions & claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== CACHE_NAME)
          .map((name) => caches.delete(name))
      )
    }).then(() => {
      return self.clients.claim()
    })
  )
})

// 3. Fetch Event: Safe routing with zero data caching
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // A. Only intercept GET requests — NEVER touch mutations (POST, PUT, DELETE, PATCH)
  if (request.method !== 'GET') {
    return
  }

  // B. SECURITY: STRICT BYPASS for Supabase and all dynamic API calls
  // Never intercept or cache Supabase database, auth, storage, or custom API endpoints
  if (
    url.hostname.includes('supabase.co') ||
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/rest/v1/') ||
    url.pathname.startsWith('/auth/v1/') ||
    url.pathname.startsWith('/storage/v1/') ||
    url.pathname.includes('/auth/callback')
  ) {
    return
  }

  // C. Handle Navigation Requests (HTML pages)
  // Network-First with offline fallback
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .catch(() => {
          // If network is unavailable, serve the pre-cached offline page
          return caches.match('/offline').then((response) => {
            if (response) return response
            return new Response('You are currently offline. Please check your connection.', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({ 'Content-Type': 'text/plain' })
            })
          })
        })
    )
    return
  }

  // D. Static Assets: Next.js static files & icons
  // Stale-While-Revalidate / Cache-First for static immutable files
  if (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.json'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone()
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache)
            })
          }
          return networkResponse
        })
      })
    )
    return
  }

  // E. All other requests: default pass-through to network
})

// 4. Message Event: Allow web app to trigger update skip-waiting
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})
