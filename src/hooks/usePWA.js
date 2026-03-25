import { useState, useEffect } from 'react';

/**
 * usePWA — Maneja el prompt de instalación de la PWA.
 * Captura el evento `beforeinstallprompt` para mostrarlo cuando el usuario quiera.
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    // Detectar si ya está instalada
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    });

    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const instalarApp = async () => {
    if (!installPrompt) return;
    const { outcome } = await installPrompt.prompt();
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  return { installPrompt, isInstalled, instalarApp };
}
