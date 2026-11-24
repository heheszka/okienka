const NAZWA_CACHE = "okienka-v8";

const plikiDoZapisu = new Array(
    "./",
    "index.html",
    "styles/style1.css",
    "styles/style2.css",
    "plany.js",
    "app.js",
    "ui.js",
    "odliczanie.js",
    "manifest.json",
    "images/ikona-192.png",
    "images/ikona-512.png",
    "plany-z-uczelni.json",
    "dodatkowe.js"
);

self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(NAZWA_CACHE).then(cache => {
            return cache.addAll(plikiDoZapisu);
        })
    );
    self.skipWaiting();
});

self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(klucze => {
            return Promise.all(
                klucze
                    .filter(klucz => klucz !== NAZWA_CACHE)
                    .map(klucz => caches.delete(klucz))
            );
        })
    );
    self.clients.claim();
});

self.addEventListener("fetch", event => {
    // Nie zapisuj w cache zapytań do API (tym zajmuje się localStorage)
    if (event.request.url.includes("/api/")) return;

    event.respondWith(
        fetch(event.request)
            .then(odpowiedz => {
                const kopia = odpowiedz.clone();
                caches.open(NAZWA_CACHE).then(cache => cache.put(event.request, kopia));
                return odpowiedz;
            })
            .catch(() => caches.match(event.request))
    );
});
