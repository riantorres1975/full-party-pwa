const CACHE_PREFIX = 'full-party';
const APP_CACHE = `${CACHE_PREFIX}-app-v1`;
const ASSET_CACHE = `${CACHE_PREFIX}-assets-v1`;
const IMAGE_CACHE = `${CACHE_PREFIX}-images-v1`;
const APP_SHELL_KEY = '/__full_party_app_shell__';
const OFFLINE_URL = '/offline.html';
const MAX_ASSET_CACHE = 80;
const MAX_IMAGE_CACHE = 150;

const PRECACHE_ASSETS = [
  OFFLINE_URL,
  '/manifest.json',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/fonts/fredoka-one.woff2',
  '/fonts/nunito-latin-400-normal.woff2',
  '/fonts/nunito-latin-700-normal.woff2',
];

async function precacheAppShell() {
  const response = await fetch('/catalogo', { cache: 'no-store' });
  if (!response.ok || !response.headers.get('content-type')?.includes('text/html')) return;

  const appCache = await caches.open(APP_CACHE);
  await appCache.put(APP_SHELL_KEY, response.clone());

  const html = await response.text();
  const assetUrls = [...html.matchAll(/(?:src|href)="(\/assets\/[^"?]+\.(?:js|css))"/g)]
    .map((match) => match[1]);

  if (assetUrls.length > 0) {
    const assetCache = await caches.open(ASSET_CACHE);
    await Promise.all(assetUrls.map((url) => assetCache.add(url).catch(() => null)));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    Promise.all([
      caches.open(APP_CACHE).then((cache) =>
        Promise.all(PRECACHE_ASSETS.map((asset) => cache.add(asset).catch(() => null)))
      ),
      precacheAppShell().catch(() => null),
    ])
  );
  self.skipWaiting();
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }

  if (event.data?.type === 'CACHE_URLS' && Array.isArray(event.data.urls)) {
    const urls = event.data.urls.filter((value) => {
      try {
        const url = new URL(value, self.location.origin);
        return url.origin === self.location.origin && url.pathname.startsWith('/assets/');
      } catch {
        return false;
      }
    });

    event.waitUntil(
      caches.open(ASSET_CACHE).then((cache) =>
        Promise.all(
          urls.map(async (url) => {
            const response = await fetch(url).catch(() => null);
            if (response && isCacheable(response)) {
              await cache.put(url, response);
            }
          })
        ).then(() => trimCache(ASSET_CACHE, MAX_ASSET_CACHE))
      )
    );
  }
});

self.addEventListener('activate', (event) => {
  const currentCaches = new Set([APP_CACHE, ASSET_CACHE, IMAGE_CACHE]);

  event.waitUntil(
    Promise.all([
      caches.keys().then((keys) =>
        Promise.all(
          keys
            .filter((key) => {
              const isCurrentAppCache = key.startsWith(`${CACHE_PREFIX}-`);
              const isLegacyAppCache = /^catalogo-(?:v|img-)/.test(key);
              return (isCurrentAppCache || isLegacyAppCache) && !currentCaches.has(key);
            })
            .map((key) => caches.delete(key))
        )
      ),
      self.clients.claim(),
    ])
  );
});

function isImageRequest(request) {
  const accept = request.headers.get('Accept') || '';
  return accept.includes('image/') ||
    /\.(jpe?g|png|gif|webp|avif|svg|ico)(\?|$)/i.test(request.url);
}

function isHashedAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith('/assets/');
}

function isHtmlResponse(response) {
  return response.headers.get('content-type')?.includes('text/html');
}

function isCacheable(response) {
  return response?.status === 200 && !isHtmlResponse(response);
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  const excess = keys.length - maxEntries;

  if (excess > 0) {
    await Promise.all(keys.slice(0, excess).map((key) => cache.delete(key)));
  }
}

async function notifyClients(message) {
  const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  clients.forEach((client) => client.postMessage(message));
}

async function handleNavigation(request, event) {
  const cache = await caches.open(APP_CACHE);

  try {
    const response = await fetch(new Request(request, { cache: 'no-store' }));

    if (response.ok && isHtmlResponse(response)) {
      event.waitUntil(cache.put(APP_SHELL_KEY, response.clone()));
    }

    return response;
  } catch {
    return (
      (await cache.match(APP_SHELL_KEY)) ||
      (await cache.match(OFFLINE_URL)) ||
      new Response('Sin conexion', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=UTF-8' },
      })
    );
  }
}

async function fetchAndCacheImage(request) {
  try {
    const response = await fetch(request);
    const canCache = response?.ok || response?.type === 'opaque';

    if (canCache) {
      const cache = await caches.open(IMAGE_CACHE);
      await cache.put(request, response.clone());
      await trimCache(IMAGE_CACHE, MAX_IMAGE_CACHE);
    }

    return response;
  } catch {
    return null;
  }
}

async function handleImage(request, event) {
  const cached = await caches.match(request);
  const revalidate = fetchAndCacheImage(request);

  if (cached) {
    event.waitUntil(revalidate);
    return cached;
  }

  return (await revalidate) || new Response('', { status: 404 });
}

async function handleHashedAsset(request, event) {
  const cache = await caches.open(ASSET_CACHE);
  const cached = await cache.match(request);
  if (cached) return cached;

  try {
    const response = await fetch(request);

    if (isHtmlResponse(response)) {
      event.waitUntil(notifyClients({ type: 'FORCE_RELOAD' }));
      return Response.error();
    }

    if (isCacheable(response)) {
      event.waitUntil(
        cache.put(request, response.clone()).then(() => trimCache(ASSET_CACHE, MAX_ASSET_CACHE))
      );
    }

    return response;
  } catch {
    return Response.error();
  }
}

async function handleSameOriginRequest(request, event) {
  const cache = await caches.open(APP_CACHE);

  try {
    const response = await fetch(request);

    if (isCacheable(response)) {
      event.waitUntil(cache.put(request, response.clone()));
    }

    return response;
  } catch {
    return (await cache.match(request)) || Response.error();
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (request.mode === 'navigate') {
    event.respondWith(handleNavigation(request, event));
    return;
  }

  if (isImageRequest(request)) {
    event.respondWith(handleImage(request, event));
    return;
  }

  if (isHashedAsset(url)) {
    event.respondWith(handleHashedAsset(request, event));
    return;
  }

  if (url.origin === self.location.origin) {
    event.respondWith(handleSameOriginRequest(request, event));
  }
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/admin/pedidos';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }

      return self.clients.openWindow ? self.clients.openWindow(targetUrl) : null;
    })
  );
});
