const CACHE_NAME = 'hugus-fc-image-v2';
const assets = [
  '/',
  '/index.html',
  '/calendario.html',
  '/tabla.html',
  '/tienda.html',
  '/login.html',
  '/css/style.css',
  '/imag/logo.png' 
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(assets);
    })
  );
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys => {
      return Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

self.addEventListener('fetch', e => {
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});