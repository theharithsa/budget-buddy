const CACHE_NAME = 'finbuddy-v1.0.0';
const API_CACHE_NAME = 'finbuddy-api-v1.0.0';

// Files to cache for offline functionality
const STATIC_CACHE_URLS = [
  '/',
  '/index.html',
  '/src/main.tsx',
  '/src/main.css',
  '/src/App.tsx',
  '/manifest.json',
  // Add other critical assets
];

// API endpoints to cache
const API_CACHE_URLS = [
  // Firebase endpoints will be cached dynamically
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('📦 Service Worker: Caching static assets');
        return cache.addAll(STATIC_CACHE_URLS);
      })
      .then(() => {
        console.log('✅ Service Worker: Installation complete');
        return self.skipWaiting();
      })
      .catch((error) => {
        console.error('❌ Service Worker: Installation failed', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('🚀 Service Worker: Activating...');
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== API_CACHE_NAME) {
              console.log('🗑️ Service Worker: Deleting old cache', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('✅ Service Worker: Activation complete');
        return self.clients.claim();
      })
  );
});

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle different types of requests
  if (request.method === 'GET') {
    
    // Firebase API requests - Network First strategy
    if (url.hostname.includes('firebase') || url.hostname.includes('googleapis')) {
      event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
      return;
    }
    
    // Static assets - Cache First strategy
    if (request.destination === 'document' || 
        request.destination === 'script' || 
        request.destination === 'style' ||
        request.destination === 'image') {
      event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
      return;
    }
    
    // API calls to your backend - Network First strategy
    if (url.pathname.startsWith('/api/')) {
      event.respondWith(networkFirstStrategy(request, API_CACHE_NAME));
      return;
    }
    
    // Default to network first for other requests
    event.respondWith(networkFirstStrategy(request, CACHE_NAME));
  }
});

// Cache First Strategy - for static assets
async function cacheFirstStrategy(request, cacheName) {
  try {
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Serve from cache
      return cachedResponse;
    }
    
    // Not in cache, fetch from network
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the response for future use
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.error('Cache First Strategy failed:', error);
    // Return offline fallback if available
    return getOfflineFallback(request);
  }
}

// Network First Strategy - for API calls and dynamic content
async function networkFirstStrategy(request, cacheName) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Cache the successful response
      const cache = await caches.open(cacheName);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    // Network failed, try cache
    console.log('Network failed, trying cache for:', request.url);
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return offline fallback
    return getOfflineFallback(request);
  }
}

// Offline fallback responses
function getOfflineFallback(request) {
  const url = new URL(request.url);
  
  // For navigation requests, return the main app
  if (request.destination === 'document') {
    return caches.match('/');
  }
  
  // For API requests, return offline message
  if (url.pathname.startsWith('/api/')) {
    return new Response(
      JSON.stringify({
        error: 'offline',
        message: 'You are currently offline. Please check your connection.'
      }),
      {
        status: 503,
        statusText: 'Service Unavailable',
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  // Default offline response
  return new Response(
    'You are currently offline',
    {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' }
    }
  );
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('🔄 Service Worker: Background sync triggered', event.tag);
  
  if (event.tag === 'expense-sync') {
    event.waitUntil(syncExpenses());
  }
  
  if (event.tag === 'budget-sync') {
    event.waitUntil(syncBudgets());
  }
});

// Sync expenses when back online
async function syncExpenses() {
  try {
    console.log('💰 Syncing offline expenses...');
    
    // Get offline expenses from IndexedDB
    const offlineExpenses = await getOfflineExpenses();
    
    if (offlineExpenses.length > 0) {
      // Send to Firebase when online
      for (const expense of offlineExpenses) {
        await syncExpenseToFirebase(expense);
      }
      
      // Clear offline storage
      await clearOfflineExpenses();
      console.log('✅ Offline expenses synced successfully');
    }
  } catch (error) {
    console.error('❌ Failed to sync expenses:', error);
  }
}

// Sync budgets when back online
async function syncBudgets() {
  try {
    console.log('📊 Syncing offline budgets...');
    // Similar logic for budgets
  } catch (error) {
    console.error('❌ Failed to sync budgets:', error);
  }
}

// Placeholder functions for IndexedDB operations
async function getOfflineExpenses() {
  // TODO: Implement IndexedDB operations
  return [];
}

async function clearOfflineExpenses() {
  // TODO: Implement IndexedDB operations
}

async function syncExpenseToFirebase(expense) {
  // TODO: Implement Firebase sync
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('📱 Service Worker: Push notification received');
  
  const options = {
    body: event.data ? event.data.text() : 'New notification from FinBuddy',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Open FinBuddy',
        icon: '/icons/icon-96x96.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-96x96.png'
      }
    ]
  };
  
  event.waitUntil(
    self.registration.showNotification('FinBuddy', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Service Worker: Notification clicked', event.action);
  
  event.notification.close();
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});
