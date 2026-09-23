const CACHE_NAME = "beauty-studio-v83"
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
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL)));
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key)))
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", event => {
  if (event.request.method !== "GET") return;
  const url = new URL(event.request.url);
  const isSameOrigin = url.origin === self.location.origin;
  const isDocument = event.request.mode === "navigate" || url.pathname.endsWith("/") || url.pathname.endsWith(".html");
  const isAsset = /\.(js|css)(\?|$)/i.test(url.pathname + url.search);
  if (isDocument) {
    event.respondWith(fetch(event.request).then(response => { const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy)); return response; }).catch(()=>caches.match("./index.html")));
    return;
  }
  if (isSameOrigin && isAsset) {
    event.respondWith(fetch(event.request).then(response => { if(response.ok){const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));} return response; }).catch(()=>caches.match(event.request)));
    return;
  }
  event.respondWith(caches.match(event.request).then(cached => cached || fetch(event.request).then(response => { if(response.ok && isSameOrigin){const copy=response.clone(); caches.open(CACHE_NAME).then(cache=>cache.put(event.request,copy));} return response; })));
});
