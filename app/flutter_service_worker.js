self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));

      if (self.registration.unregister) {
        await self.registration.unregister();
      }

      const clientsList = await self.clients.matchAll({
        includeUncontrolled: true,
        type: "window",
      });
      for (const client of clientsList) {
        client.navigate(client.url);
      }
    })(),
  );
});

self.addEventListener("fetch", () => {});
