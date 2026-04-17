import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { LanguageProvider } from './hooks/useLanguage';

const AuthCatalogRoutes = lazy(() => import('./routes/AuthCatalogRoutes'));
const Sucursales        = lazy(() => import('./pages/Sucursales'));
const ComoFunciona      = lazy(() => import('./pages/ComoFunciona'));
const Destacados        = lazy(() => import('./pages/Destacados'));
const Blog              = lazy(() => import('./pages/Blog'));
const BlogArticulo      = lazy(() => import('./pages/BlogArticulo'));

const Spinner = (
  <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
    <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
  </div>
);

const SITE_NAME   = 'Full Party Uruapan';
const SITE_URL    = 'https://www.fullpartyuruapan.com.mx';

const PAGE_META = {
  '/':        {
    title:       `${SITE_NAME} — Artículos para Fiesta al Mayoreo en Uruapan`,
    description: 'Distribuidora de artículos para fiesta en Uruapan, Michoacán. +500 productos: globos Glomex, cortinas de lluvia, guirnaldas, velas y sets. Mayoreo y menudeo. Envíos a todo México.',
    canonical:   `${SITE_URL}/`,
  },
  '/catalogo': {
    title:       `Catálogo de Artículos para Fiesta | ${SITE_NAME}`,
    description: 'Explora +500 productos al mayoreo: globos de látex Glomex, globos foil, cortinas de lluvia, guirnaldas, velas, sets y accesorios. Precios escalonados y envíos a todo México.',
    canonical:   `${SITE_URL}/catalogo`,
  },
  '/admin':   {
    title:       `Administración | ${SITE_NAME}`,
    description: null,
    canonical:   null,
  },
  '/sucursales': {
    title:       `Sucursales en Uruapan | ${SITE_NAME}`,
    description: 'Visítanos en Uruapan, Michoacán. Suc. Francisco Villa (C. Francisco Villa 103, Centro) y Suc. Sol Naciente (Universo 117). Envíos a todo México y recolección en tienda.',
    canonical:   `${SITE_URL}/sucursales`,
  },
  '/como-funciona': {
    title:       `¿Cómo hacer un pedido? | ${SITE_NAME}`,
    description: 'Aprende cómo pedir al mayoreo en Full Party Uruapan en 4 pasos: navega el catálogo, agrega al carrito, revisa y envía por WhatsApp. Atención personalizada para decoradores y revendedores.',
    canonical:   `${SITE_URL}/como-funciona`,
  },
  '/destacados': {
    title:       `Categorías Destacadas | ${SITE_NAME}`,
    description: 'Las categorías más solicitadas de Full Party Uruapan: globos de látex Glomex, globos foil, números, personajes, cortinas, guirnaldas, velas y sets al mayoreo.',
    canonical:   `${SITE_URL}/destacados`,
  },
  '/blog': {
    title:       `Blog | ${SITE_NAME}`,
    description: 'Guías, tutoriales e ideas para decorar tus fiestas. Consejos prácticos de decoradores profesionales sobre globos, arcos, paletas de color y más.',
    canonical:   `${SITE_URL}/blog`,
  },
};

function setPageMeta({ title, description, canonical }) {
  if (title) document.title = title;

  const mDesc = document.querySelector('meta[name="description"]');
  if (mDesc && description) mDesc.setAttribute('content', description);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && title) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc && description) ogDesc.setAttribute('content', description);

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle && title) twTitle.setAttribute('content', title);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc && description) twDesc.setAttribute('content', description);

  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (!canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  if (canonical) canonicalEl.href = canonical;
}

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
    const path = location.pathname;
    // /blog/:slug lo maneja el propio componente BlogArticulo con su meta dinámico
    if (path.startsWith('/blog/')) return;
    const meta =
      PAGE_META[path] ??
      (path.startsWith('/admin')   ? PAGE_META['/admin']   : null) ??
      (path.startsWith('/catalogo')? PAGE_META['/catalogo']: null) ??
      PAGE_META['/'];
    setPageMeta(meta);
  }, [location.pathname]);

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
          <Route
            path="/sucursales"
            element={
              <Suspense fallback={Spinner}>
                <Sucursales />
              </Suspense>
            }
          />
          <Route
            path="/como-funciona"
            element={
              <Suspense fallback={Spinner}>
                <ComoFunciona />
              </Suspense>
            }
          />
          <Route
            path="/destacados"
            element={
              <Suspense fallback={Spinner}>
                <Destacados />
              </Suspense>
            }
          />
          <Route
            path="/blog"
            element={
              <Suspense fallback={Spinner}>
                <Blog />
              </Suspense>
            }
          />
          <Route
            path="/blog/:slug"
            element={
              <Suspense fallback={Spinner}>
                <BlogArticulo />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  );
}
