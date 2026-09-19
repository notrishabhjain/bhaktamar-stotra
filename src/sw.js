/**
 * Offline support. The shell is precached on install; everything else is
 * cached as it is fetched, so a verse you have read stays readable with no
 * connection. Cache-first for static assets, network-first for pages so a
 * rebuild is picked up as soon as the device is online.
 */
var VERSION = 'bhaktamar-v1';
var SCOPE = new URL('./', self.registration.scope).pathname;

var SHELL = [
  SCOPE,
  SCOPE + 'abhi/',
  SCOPE + 'rachna/',
  SCOPE + 'paath/',
  SCOPE + 'assets/css/site.css',
  SCOPE + 'assets/js/site.js',
  SCOPE + 'assets/fonts/noto-serif-devanagari-400.woff2',
  SCOPE + 'assets/fonts/lora-400.woff2',
  SCOPE + 'assets/fonts/inter-400.woff2',
];

self.addEventListener('install', function (event) {
  event.waitUntil(
    caches.open(VERSION).then(function (cache) {
      // A single missing entry must not fail the whole install.
      return Promise.all(SHELL.map(function (url) {
        return cache.add(url).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (event) {
  event.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; })
        .map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (event) {
  var request = event.request;
  if (request.method !== 'GET') return;
  var url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  var isPage = request.mode === 'navigate';

  if (isPage) {
    event.respondWith(
      fetch(request)
        .then(function (response) {
          var copy = response.clone();
          caches.open(VERSION).then(function (c) { c.put(request, copy); });
          return response;
        })
        .catch(function () {
          return caches.match(request).then(function (hit) {
            return hit || caches.match(SCOPE);
          });
        })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(function (hit) {
      return (
        hit ||
        fetch(request).then(function (response) {
          if (response.ok) {
            var copy = response.clone();
            caches.open(VERSION).then(function (c) { c.put(request, copy); });
          }
          return response;
        })
      );
    })
  );
});
