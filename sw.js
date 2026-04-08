const CACHE_NAME = 'helix-focus-1775626945';
const ASSETS_TO_CACHE = [
    './',
    './index.html',
    './app.js',
    './theme.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (e) => {
    e.waitUntil(
        caches.keys().then((keyList) => {
            return Promise.all(keyList.map((key) => {
                if (key !== CACHE_NAME) return caches.delete(key);
            }));
        })
    );
});

self.addEventListener('fetch', (e) => {
    // Estrategia: Caché Dinámico (Cache First -> Network -> Save to Cache)
    e.respondWith(
        caches.match(e.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            
            return fetch(e.request).then((networkResponse) => {
                // Solo cachear respuestas exitosas de nuestros propios recursos
                if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
                    return networkResponse;
                }
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then((cache) => {
                    cache.put(e.request, responseToCache);
                });
                return networkResponse;
            });
        })
    );
});

self.addEventListener('message', (e) => {
    if (e.data && e.data.action === 'skipWaiting') {
        self.skipWaiting();
    }
});