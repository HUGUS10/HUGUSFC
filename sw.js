const CACHE_NAME = 'hugusfc-v1.0.1';  // ✅ CAMBIADO: incrementa la versión para que los dispositivos descarguen los nuevos archivos (Firestore, etc.)

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
  self.skipWaiting(); // Toma el control inmediatamente
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys => Promise.all(
      keys.map(key => {
        if (key !== CACHE_NAME) return caches.delete(key);
      })
    ))
  );
  self.clients.claim(); // Activa el SW en todas las pestañas
});

self.addEventListener('fetch', event => {
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Estrategia "network first": actualiza la caché con la respuesta de red
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, responseToCache);
        });
        return response;
      })
      .catch(() => {
        // Si falla la red, sirve desde caché (offline)
        return caches.match(event.request);
      })
  );
});