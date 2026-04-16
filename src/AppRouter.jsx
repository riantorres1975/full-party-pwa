import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { LanguageProvider } from './hooks/useLanguage';

const AuthCatalogRoutes = lazy(() => import('./routes/AuthCatalogRoutes'));

const Spinner = (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
    <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
  </div>
);

function RouterEffects() {
  const location = useLocation();
  const navigate = useNavigate();
  const esRutaLanding = location.pathname === '/';

  // PWA instalada: redirigir al catálogo si se abre en modo standalone
  useEffect(() => {
    if (location.pathname !== '/') return;
    const standalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone;
    if (standalone) navigate('/catalogo', { replace: true });
  }, []);

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

  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <RouterEffects />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/catalogo"
            element={
              <Suspense fallback={Spinner}>
                <AuthCatalogRoutes />
              </Suspense>
            }
          />
          <Route
            path="/catalogo/:categoria"
            element={
              <Suspense fallback={Spinner}>
                <AuthCatalogRoutes />
              </Suspense>
            }
          />
          <Route
            path="/admin/*"
            element={
              <Suspense fallback={Spinner}>
                <AuthCatalogRoutes />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
}
