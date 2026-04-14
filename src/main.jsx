import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import './index.css';

// Capturar prompt de instalación desde el arranque (aunque aún no monte el catálogo)
if (typeof window !== 'undefined' && !window.__fpInstallPromptListenerAttached) {
  window.__fpInstallPromptListenerAttached = true;
  window.__fpDeferredInstallPrompt = window.__fpDeferredInstallPrompt || null;

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    window.__fpDeferredInstallPrompt = event;
    window.dispatchEvent(new Event('fp-installprompt-ready'));
  });

  window.addEventListener('appinstalled', () => {
    window.__fpDeferredInstallPrompt = null;
    window.dispatchEvent(new Event('fp-installprompt-cleared'));
  });
}

// Dynamic preconnect for Supabase (images load faster)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
if (supabaseUrl) {
  const link = document.createElement('link');
  link.rel = 'preconnect';
  link.href = supabaseUrl;
  link.crossOrigin = 'anonymous';
  document.head.appendChild(link);
}

// Registrar Service Worker (PWA)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
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
          window.location.reload();
        });

        // Escuchar mensaje del SW cuando detecta chunks faltantes (nueva versión)
        navigator.serviceWorker.addEventListener('message', (event) => {
          if (event.data?.type === 'FORCE_RELOAD') {
            window.location.reload();
          }
        });

        // Chequear actualizaciones cada 5 minutos (en vez de cada 24h por defecto)
        setInterval(() => {
          registration.update().catch(() => {});
        }, 5 * 60 * 1000);
      })
      .catch(() => {});
  });
}

// Auto-reload si ocurre un error cargando modulos (e.g. nueva version en Vercel)
window.addEventListener('vite:preloadError', (event) => {
  event.preventDefault();
  window.location.reload(true);
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
