import { useState, useEffect, lazy, Suspense } from 'react';
import LandingPage from './pages/LandingPage';
import { LanguageProvider } from './hooks/useLanguage';

const AuthCatalogRoutes = lazy(() => import('./routes/AuthCatalogRoutes'));

function useHashRoute() {
  const [hash, setHash] = useState(() => {
    const currentHash = window.location.hash;
    if (currentHash) return currentHash;

    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
    if (standalone) {
      window.location.hash = '#/catalogo';
      return '#/catalogo';
    }

    return currentHash;
  });
  useEffect(() => {
    const handler = () => setHash(window.location.hash);
    window.addEventListener('hashchange', handler);
    window.addEventListener('popstate', handler);
    return () => {
      window.removeEventListener('hashchange', handler);
      window.removeEventListener('popstate', handler);
    };
  }, []);
  return hash;
}

export default function AppRouter() {
  const hash = useHashRoute();
  const esRutaLanding = !hash.startsWith('#/admin') && !hash.startsWith('#/catalogo');

  // Forzar landing en tema claro y revelar app sin esperar auth
  useEffect(() => {
    document.body.classList.toggle('landing-page', esRutaLanding);

    if (esRutaLanding) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('theme-dark');
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', '#fbf7f3');
    }

    return () => {
      document.body.classList.remove('landing-page');
    };
  }, [esRutaLanding]);

  useEffect(() => {
    if (!esRutaLanding) return;

    const revealApp = () => {
      if (typeof window.__fpMarkAppReady === 'function') {
        window.__fpMarkAppReady();
      }
    };

    if (document.fonts?.ready) {
      const timeoutId = setTimeout(() => {
        requestAnimationFrame(revealApp);
      }, 350);

      document.fonts.ready
        .then(() => {
          clearTimeout(timeoutId);
          requestAnimationFrame(revealApp);
        })
        .catch(() => {
          clearTimeout(timeoutId);
          requestAnimationFrame(revealApp);
        });

      return () => clearTimeout(timeoutId);
    }

    requestAnimationFrame(revealApp);
  }, [esRutaLanding]);

  return (
    <LanguageProvider>
      {esRutaLanding ? (
        <LandingPage />
      ) : (
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
              <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
            </div>
          }
        >
          <AuthCatalogRoutes hash={hash} />
        </Suspense>
      )}
    </LanguageProvider>
  );
}
