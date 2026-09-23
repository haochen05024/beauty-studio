const CACHE_NAME = "beauty-studio-v92";
const APP_SHELL = [
  "./",
  "./index.html",
  "./assets/css/style.css",
  "./assets/js/app.js",
  "./manifest.webmanifest",
  "./assets/icons/icon-192.png",
  "./assets/icons/icon-512.png",
  "./assets/icons/apple-touch-icon.png",
  "./assets/icons/favicon.svg",
  "./assets/icons/logo.svg"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const same = url.origin === self.location.origin;
  const documentRequest = event.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  const codeOrStyle = /\.(js|css)(\?|$)/i.test(url.pathname + url.search);
  if (documentRequest || (same && codeOrStyle)) {
    event.respondWith(fetch(event.request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)).catch(() => {}); }
      return response;
    }).catch(() => caches.match(event.request).then(r => r || caches.match("./index.html"))));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => {
    if (response.ok && same) { const copy = response.clone(); caches.open(CACHE_NAME).then(c => c.put(event.request, copy)).catch(() => {}); }
    return response;
  })));
});
