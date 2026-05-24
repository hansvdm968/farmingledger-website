const CACHE_NAME = "farming-ledger-v5";
const APP_SHELL = [
  "/",
  "/index.html",
  "/styles.css?v=13",
  "/app.js?v=13",
  "/contact.html",
  "/pricing.html",
  "/privacy-policy.html",
  "/cookie-notice.html",
  "/terms-of-use.html",
  "/security.html",
  "/assets/farming-ledger-logo.png",
  "/downloads.json",
  "/site.webmanifest"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
    )
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request).then((cached) => cached || caches.match("/index.html")))
  );
});
