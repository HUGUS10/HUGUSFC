const CACHE_NAME = 'hugusfc-v1';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/js/auth.js',
    '/js/partidos.js',
    '/js/noticias.js',
    '/js/main.js',
    '/imag/logo.png',
    '/imag/escudo_hugusfc.png',
    '/imag/kit_oficial.png'
];

self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                return cache.addAll(urlsToCache);
            })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                if (response) {
                    return response;
                }
                return fetch(event.request);
            })
    );
});