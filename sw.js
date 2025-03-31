// Service Worker for Handy Memo PWA

const CACHE_NAME = 'handy-memo-cache-v1';
// List of files that make up the application shell
const urlsToCache = [
  '/', // Alias for index.html
  'index.html',
  'style.css',
  'app.js',
  'manifest.json',
  // Add paths to icons if they exist locally (e.g., 'icons/icon-192x192.png')
  // For now, we assume icons are referenced correctly in manifest.json
  // and might be cached implicitly or need explicit addition if local.
  'https://fonts.googleapis.com/icon?family=Material+Icons+Outlined' // Cache the icon font CSS
];

// Install event: Cache the application shell
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Install event');
  // Perform install steps
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Opened cache:', CACHE_NAME);
        // Add all the specified URLs to the cache
        // Use { cache: 'reload' } to bypass HTTP cache for these requests during install
        return cache.addAll(urlsToCache.map(url => new Request(url, { cache: 'reload' })));
      })
      .then(() => {
        console.log('[Service Worker] Application shell cached successfully');
        // Force the waiting service worker to become the active service worker.
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('[Service Worker] Caching failed during install:', error);
      })
  );
});

// Activate event: Clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activate event');
  const cacheWhitelist = [CACHE_NAME]; // Only keep the current cache
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        console.log('[Service Worker] Claiming clients');
        // Take control of all open clients immediately
        return self.clients.claim();
    })
  );
});

// Fetch event: Serve cached content when offline (Cache-first strategy)
self.addEventListener('fetch', (event) => {
  console.log('[Service Worker] Fetch event for:', event.request.url);
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response from cache
        if (response) {
          console.log('[Service Worker] Returning response from cache:', event.request.url);
          return response;
        }

        // Not in cache - fetch from network
        console.log('[Service Worker] Fetching from network:', event.request.url);
        return fetch(event.request).then(
          (networkResponse) => {
            // Optional: Cache the newly fetched resource dynamically
            // Be careful with what you cache dynamically, especially large files or API responses
            // if (networkResponse && networkResponse.status === 200 && event.request.method === 'GET') {
            //   const responseToCache = networkResponse.clone();
            //   caches.open(CACHE_NAME)
            //     .then(cache => {
            //       cache.put(event.request, responseToCache);
            //     });
            // }
            return networkResponse;
          }
        ).catch((error) => {
            console.error('[Service Worker] Fetch failed; returning offline page if available, or error:', error);
            // Optional: Return a custom offline fallback page
            // return caches.match('/offline.html');
        });
      })
  );
});
