/* Reeef service worker — makes the store installable and fast on repeat visits.
   Static files (produce photos, icons, Next.js bundles) are served from cache;
   pages are always fetched fresh, falling back to the last copy when offline.
   API calls, checkout and the dashboard are never cached. */
const VERSION = "reeef-v1";
const STATIC = `${VERSION}-static`;
const PAGES = `${VERSION}-pages`;

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(PAGES).then((c) => c.addAll(["/"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

const isStatic = (url) => url.origin === self.location.origin && (/^\/(plants|img|icons)\//.test(url.pathname) || url.pathname.startsWith("/_next/static/"));
const isPrivate = (url) => /^\/(api|admin|checkout|account|cart|files)/.test(url.pathname);

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin || isPrivate(url)) return;

  if (isStatic(url)) {
    e.respondWith(caches.open(STATIC).then(async (c) => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) c.put(req, res.clone());
      return res;
    }));
    return;
  }

  if (req.mode === "navigate") {
    e.respondWith(fetch(req).then((res) => {
      if (res.ok) { const copy = res.clone(); caches.open(PAGES).then((c) => c.put(req, copy)); }
      return res;
    }).catch(async () => (await caches.match(req)) || (await caches.match("/")) || Response.error()));
  }
});
