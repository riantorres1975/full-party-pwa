// Service Worker — Catálogo Digital PWA
const CACHE_NAME = 'catalogo-v8';
const IMG_CACHE  = 'catalogo-img-v2';
const MAX_IMG_CACHE = 150; // max images to keep cached

// Recursos a cachear en la instalación (NO incluir index.html — siempre se pide al server)
const STATIC_ASSETS = [
  '/manifest.json',
];

// ── Instalación: pre-cachear assets estáticos ──────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Permite activar manualmente una nueva version desde la app
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    if (!event.source) return;
    self.skipWaiting();
  }
});

// ── Activación: limpiar caches viejos ──────────────────────────────────────
self.addEventListener('activate', (event) => {
  const keepCaches = [CACHE_NAME, IMG_CACHE];
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => !keepCaches.includes(key))
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

/**
 * Is this request for an image?
 */
function isImageRequest(request) {
  const url = request.url;
  const accept = request.headers.get('Accept') || '';
  return accept.includes('image/') ||
    /\.(jpe?g|png|gif|webp|avif|svg|ico)(\?|$)/i.test(url);
}

/**
 * Trim image cache to MAX_IMG_CACHE entries (LRU-like: delete oldest)
 */
async function trimImageCache() {
  const cache = await caches.open(IMG_CACHE);
  const keys = await cache.keys();
  if (keys.length > MAX_IMG_CACHE) {
    const toDelete = keys.slice(0, keys.length - MAX_IMG_CACHE);
    await Promise.all(toDelete.map((k) => cache.delete(k)));
  }
}

// ── Fetch handler ──────────────────────────────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Solo interceptar GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // ── Navegación (HTML): SIEMPRE network, sin cache ────────────────────
  // Esto garantiza que tras un deploy las pestañas reciban el nuevo index.html
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          // Offline fallback: página mínima sin inline script (CSP-safe)
          return new Response(
            '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8">' +
            '<meta name="viewport" content="width=device-width,initial-scale=1">' +
            '<title>Sin conexión</title></head><body style="display:flex;align-items:center;' +
            'justify-content:center;min-height:100vh;font-family:sans-serif;text-align:center;' +
            'background:#fbf7f3">' +
            '<div><h1 style="font-size:1.5rem;color:#333">Sin conexión</h1>' +
            '<p style="color:#666">Revisa tu conexión a internet e intenta de nuevo.</p>' +
            '<noscript><meta http-equiv="refresh" content="5"></noscript>' +
            '</div></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=UTF-8' } }
          );
        })
      )
    );
    return;
  }

  // ── Imagen: Cache First (stale-while-revalidate) ─────────────────────
  // Images from Supabase storage or external CDNs
  if (isImageRequest(event.request)) {
    event.respondWith(
      caches.open(IMG_CACHE).then(async (cache) => {
        const cached = await cache.match(event.request);

        // Background revalidate — usar no-cors para imágenes externas
        const networkFetch = fetch(event.request).then((response) => {
          // Solo cachear respuestas exitosas y transparentes (no opacas rotas)
          if (response && (response.status === 200 || response.type === 'opaque')) {
            cache.put(event.request, response.clone()).catch(() => {});
            trimImageCache();
          }
          return response;
        }).catch(() => null);

        // Return cached immediately, or wait for network
        if (cached) return cached;
        const netResponse = await networkFetch;
        return netResponse || new Response('', { status: 404 });
      })
    );
    return;
  }

  // ── Non-image same-origin: Network First ─────────────────────────────
  if (url.origin !== location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // Prevenir que Vercel SPA fallback (200 OK con HTML) se cacheé como un JS/CSS
        const isAssetRequest = url.pathname.match(/\.(js|css)$/i);
        const isHtmlResponse = response.headers.get('content-type')?.includes('text/html');

        if (isAssetRequest && isHtmlResponse) {
          // El chunk fue borrado del servidor (nueva versión en deploy)
          // Notificar a todos los clientes que recarguen
          self.clients.matchAll().then((clients) => {
            clients.forEach((client) => client.postMessage({ type: 'FORCE_RELOAD' }));
          });
          return Response.error(); 
        }

        // Clonar y guardar en cache si la respuesta es válida
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // Sin red → intentar desde cache
        return caches.match(event.request).then(
          (cached) => cached || caches.match('/')
        );
      })
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const targetUrl = event.notification?.data?.url || '/#/admin';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      if (self.clients.openWindow) return self.clients.openWindow(targetUrl);
      return null;
    })
  );
});
