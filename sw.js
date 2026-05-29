const CACHE_NAME = 'hugusfc-v1.0.0';  // Cambia este número cuando actualices la web
const urlsToCache = [
  '/',
  '/index.html',
  '/imag/logo.png',
  '/imag/escudo_hugusfc.png',
  '/imag/kit_oficial.png',
  '/imag/kit_completo.png',
  '/imag/pelota.png',
  '/imag/bandera.png',
  '/imag/camiseta.png',
  '/imag/bandera_oficial.png',
  '/imag/pelota_oficial.png',
  '/imag/gorra.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  self.skipWaiting(); // Fuerza la activación inmediata
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim(); // Toma control de todos los clientes
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Si la red responde, actualiza la caché con la nueva respuesta
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si la red falla, sirve desde caché
        return caches.match(event.request);
      })
  );
});