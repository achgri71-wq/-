const CACHE_NAME = 'invoice-compare-v2';
const STATIC_CACHE = 'invoice-static-v2';
const DYNAMIC_CACHE = 'invoice-dynamic-v2';

const STATIC_ASSETS = [
    './',
    './index.html',
    './manifest.json',
    './icon-192.png',
    './icon-512.png'
];

const EXTERNAL_ASSETS = [
    'https://cdn.tailwindcss.com',
    'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js',
    'https://fonts.googleapis.com/css2?family=Tajawal:wght@200;400;500;700;900&display=swap'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        Promise.all([
            caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS)),
            caches.open(DYNAMIC_CACHE).then((cache) => {
                return Promise.allSettled(
                    EXTERNAL_ASSETS.map(url =>
                        fetch(url, { mode: 'cors' })
                            .then(response => { if (response.ok) cache.put(url, response); })
                            .catch(() => {})
                    )
                );
            })
        ]).then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    if (event.request.method !== 'GET') return;
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return fetch(event.request).then((response) => {
                if (response.ok) {
                    caches.open(DYNAMIC_CACHE).then((cache) => cache.put(event.request, response.clone()));
                }
                return response;
            }).catch(() => {
                if (event.request.mode === 'navigate') return caches.match('./index.html');
                return new Response('Offline', { status: 503 });
            });
        })
    );
});

self.addEventListener('push', (event) => {
    event.waitUntil(self.registration.showNotification('نظام الفواتير', {
        body: event.data?.text() || 'تحديث جديد',
        icon: './icon-192.png',
        dir: 'rtl',
        lang: 'ar'
    }));
});