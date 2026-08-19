const CACHE_NAME = 'lilyum-design-v5';
const CORE_ASSETS = ['./', './index.html', './style.css', './studio.css', './polish.css', './features.css', './refinement.css', './art-direction.css', './lilyum.css', './app.js', './features.js', './lilyum-config.js', './lilyum-auth.js', './icon.svg', './og.png', './assets/atelier-dream.jpg', './assets/inner-weather.jpg', './assets/sundown-club.jpg', './assets/blue-hour.jpg', './assets/soft-rebel.jpg', './assets/memory-garden.jpg', './assets/other-side.jpg'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(CORE_ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  if (event.request.mode === 'navigate') {
    event.respondWith(fetch(event.request).then(response => {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put('./index.html', copy));
      return response;
    }).catch(() => caches.match('./index.html')));
    return;
  }
  event.respondWith(fetch(event.request).then(response => {
    if (response.ok && new URL(event.request.url).origin === location.origin) {
      const copy = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
    }
    return response;
  }).catch(() => caches.match(event.request, { ignoreSearch: true })));
});
