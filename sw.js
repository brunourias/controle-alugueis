const CACHE_NAME = "controle-alugueis-v017";

const APP_SHELL = [
  "./index.html",
  "./styles.css",
  "./app.js",
  "./manifest.json"
];

const ICONS = [
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => Promise.all(APP_SHELL.concat(ICONS).map((asset) => {
      return fetch(asset, { cache: "no-store" }).then((response) => {
        if (!response.ok) throw new Error("Falha ao armazenar " + asset);
        return cache.put(asset, response);
      });
    })).then(() => self.skipWaiting()))
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  if (new URL(event.request.url).origin !== self.location.origin) return;
  var isIcon = new URL(event.request.url).pathname.includes("/icons/");

  event.respondWith(isIcon ? cacheFirst(event.request) : networkFirst(event.request));
});

function cacheFirst(request) {
  return caches.match(request).then((cached) => cached || fetchAndCache(request));
}

function networkFirst(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  }).catch(() => caches.match(request).then((cached) => cached || (request.mode === "navigate" ? caches.match("./index.html") : Response.error())));
}

function fetchAndCache(request) {
  return fetch(request).then((response) => {
    if (response.ok) {
      var copy = response.clone();
      caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
    }
    return response;
  });
}
