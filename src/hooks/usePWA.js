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

    if (window.__fpDeferredInstallPrompt) {
      setInstallPrompt(window.__fpDeferredInstallPrompt);
    }

    const handler = (e) => {
      e.preventDefault();
      window.__fpDeferredInstallPrompt = e;
      setInstallPrompt(e);

      // Mostrar el prompt de instalación automáticamente tras un breve retraso
      const dismissed = sessionStorage.getItem('pwa-prompt-dismissed');
      if (!dismissed) {
        setTimeout(async () => {
          try {
            const { outcome } = await e.prompt();
            if (outcome === 'accepted') {
              setInstallPrompt(null);
            } else {
              sessionStorage.setItem('pwa-prompt-dismissed', '1');
            }
          } catch { /* el prompt ya fue usado */ }
        }, 1500);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    const onPromptReady = () => {
      if (window.__fpDeferredInstallPrompt) {
        setInstallPrompt(window.__fpDeferredInstallPrompt);
      }
    };

    window.addEventListener('fp-installprompt-ready', onPromptReady);

    const onInstalled = () => {
      setIsInstalled(true);
      window.__fpDeferredInstallPrompt = null;
      setInstallPrompt(null);
    };

    window.addEventListener('appinstalled', onInstalled);
    window.addEventListener('fp-installprompt-cleared', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('fp-installprompt-ready', onPromptReady);
      window.removeEventListener('appinstalled', onInstalled);
      window.removeEventListener('fp-installprompt-cleared', onInstalled);
    };
  }, []);

  const instalarApp = async () => {
    if (!installPrompt) return;
    const { outcome } = await installPrompt.prompt();
    if (outcome === 'accepted') {
      window.__fpDeferredInstallPrompt = null;
      setInstallPrompt(null);
    }
  };

  const mostrarGuiaIOS = esIOS && !isInstalled && !installPrompt;

  return { installPrompt, isInstalled, mostrarGuiaIOS, instalarApp };
}
