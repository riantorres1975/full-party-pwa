import React from 'react';
import ReactDOM from 'react-dom/client';
import AppRouter from './AppRouter';
import './index.css';

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
        const avisarUpdate = () => {
          window.dispatchEvent(new Event('fp-sw-update'));
        };

        if (registration.waiting) {
          avisarUpdate();
        }

        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          if (!newWorker) return;

          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              avisarUpdate();
            }
          });
        });

        navigator.serviceWorker.addEventListener('controllerchange', () => {
          window.location.reload();
        });
      })
      .catch(() => {});
  });
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
