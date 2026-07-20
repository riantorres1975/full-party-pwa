import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import './index.css';

const UPDATE_RELOAD_KEY = 'fp-update-reload-at';
const UPDATE_QUERY_KEY = '__fp_update';

function reloadWithFreshAssets() {
  const now = Date.now();
  const lastReload = Number(sessionStorage.getItem(UPDATE_RELOAD_KEY) || 0);
  if (now - lastReload < 15_000) return;

  sessionStorage.setItem(UPDATE_RELOAD_KEY, String(now));
  const url = new URL(window.location.href);
  url.searchParams.set(UPDATE_QUERY_KEY, String(now));
  window.location.replace(url.toString());
}

function cacheLoadedAppAssets() {
  const controller = navigator.serviceWorker?.controller;
  if (!controller) return;

  const urls = performance
    .getEntriesByType('resource')
    .map((entry) => entry.name)
    .filter((value) => {
      try {
        const url = new URL(value);
        return url.origin === window.location.origin && url.pathname.startsWith('/assets/');
      } catch {
        return false;
      }
    });

  if (urls.length > 0) {
    controller.postMessage({ type: 'CACHE_URLS', urls: [...new Set(urls)] });
  }
}

const currentUrl = new URL(window.location.href);
if (currentUrl.searchParams.has(UPDATE_QUERY_KEY)) {
  currentUrl.searchParams.delete(UPDATE_QUERY_KEY);
  window.history.replaceState(window.history.state, '', currentUrl.toString());
}

// Capturar prompt de instalación desde el arranque (aunque aún no monte el catálogo)
if (typeof window !== 'undefined' && !window.__fpInstallPromptListenerAttached) {
  window.__fpInstallPromptListenerAttached = true;
  window.__fpDeferredInstallPrompt = window.__fpDeferredInstallPrompt || null;

  window.addEventListener('beforeinstallprompt', (event) => {
    const path = window.location.pathname || '/';
    const esRutaAdmin = path.startsWith('/admin');
    if (esRutaAdmin) return;

    event.preventDefault();
    window.__fpDeferredInstallPrompt = event;
    window.dispatchEvent(new Event('fp-installprompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    window.__fpDeferredInstallPrompt = null;
    window.dispatchEvent(new Event('fp-installprompt-cleared'));
  });
}

// Registrar Service Worker (PWA) solo en produccion
if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      const hadServiceWorkerController = Boolean(navigator.serviceWorker.controller);

      navigator.serviceWorker
        .register('/sw.js', { updateViaCache: 'none' })
        .then((registration) => {
          cacheLoadedAppAssets();

          // Si hay un SW esperando, activarlo inmediatamente
          if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
          }

          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (!newWorker) return;

            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Auto-aplicar: activar el nuevo SW sin esperar clic del usuario
                newWorker.postMessage({ type: 'SKIP_WAITING' });
              }
            });
          });

          // When the new SW takes control, reload to use fresh assets
          navigator.serviceWorker.addEventListener('controllerchange', () => {
            if (hadServiceWorkerController) {
              reloadWithFreshAssets();
            } else {
              cacheLoadedAppAssets();
            }
          });

          // Escuchar mensaje del SW cuando detecta chunks faltantes (nueva versión)
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data?.type === 'FORCE_RELOAD') {
              reloadWithFreshAssets();
            }
          });

          const checkForUpdate = () => registration.update().catch(() => {});
          const checkWhenVisible = () => {
            if (document.visibilityState === 'visible') checkForUpdate();
          };

          window.addEventListener('online', checkForUpdate);
          document.addEventListener('visibilitychange', checkWhenVisible);

          // Visibility and online events cover normal returns; this is a long-session fallback.
          setInterval(() => {
            checkForUpdate();
          }, 30 * 60 * 1000);
        })
        .catch(() => {});
    });
  } else {
    // Evita comportamiento offline del SW durante desarrollo local
    window.addEventListener('load', () => {
      navigator.serviceWorker.getRegistrations()
        .then((registrations) => Promise.all(registrations.map((reg) => reg.unregister())))
        .catch(() => {});

      if ('caches' in window) {
        caches.keys()
          .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
          .catch(() => {});
      }
    });
  }
}

// Auto-reload si ocurre un error cargando modulos (e.g. nueva version en Vercel)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  reloadWithFreshAssets();
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
