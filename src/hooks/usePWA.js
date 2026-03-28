import { useState, useEffect } from 'react';

/**
 * usePWA — Maneja el prompt de instalación de la PWA.
 * Captura el evento `beforeinstallprompt` para mostrarlo cuando el usuario quiera.
 */
export function usePWA() {
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [esIOS, setEsIOS] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) {
      setIsInstalled(true);
    }

    const ua = window.navigator.userAgent || '';
    setEsIOS(/iPad|iPhone|iPod/.test(ua));

    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const onInstalled = () => {
      setIsInstalled(true);
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const instalarApp = async () => {
    if (!installPrompt) return;
    const { outcome } = await installPrompt.prompt();
    if (outcome === 'accepted') {
      setInstallPrompt(null);
    }
  };

  const mostrarGuiaIOS = esIOS && !isInstalled && !installPrompt;

  return { installPrompt, isInstalled, mostrarGuiaIOS, instalarApp };
}
