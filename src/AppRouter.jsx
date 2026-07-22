import { useEffect, useLayoutEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import { LanguageProvider } from './hooks/useLanguage';
import AppErrorBoundary from './components/ui/AppErrorBoundary';
import { buildCatalogCategoryMeta } from './utils/catalogSeo';
import { buildRouteStructuredData } from './utils/structuredData';

const AuthCatalogRoutes = lazy(() => import('./routes/AuthCatalogRoutes'));
const PublicCatalogRoute = lazy(() => import('./routes/PublicCatalogRoute'));
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
const PUBLIC_ROBOTS = 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1';

const PAGE_META = {
  '/': {
    title:       `${SITE_NAME} — Artículos para Fiesta al Mayoreo en Uruapan`,
    description: 'Distribuidora de artículos para fiesta en Uruapan, Michoacán. +500 productos: globos Glomex, cortinas de lluvia, guirnaldas, velas y sets. Mayoreo y menudeo. Envíos a todo México.',
    canonical:   `${SITE_URL}/`,
  },
  '/catalogo': {
    title:       `Catálogo de Artículos para Fiesta | ${SITE_NAME}`,
    description: 'Explora +500 productos al mayoreo: globos de látex Glomex, globos foil, cortinas de lluvia, guirnaldas, velas, sets y accesorios. Precios escalonados y envíos a todo México.',
    canonical:   `${SITE_URL}/catalogo`,
  },
  '/catalogo/globos-latex': {
    title:       `Globos de Látex al Mayoreo en Uruapan | ${SITE_NAME}`,
    description: 'Globos de látex Glomex, Decoratex y Sempertex al mayoreo. Tamaños 5", 11" y 16". Precios escalonados por volumen, envíos a todo México desde Uruapan.',
    canonical:   `${SITE_URL}/catalogo/globos-latex`,
  },
  '/catalogo/globos-numero': {
    title:       `Globos de Número al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Globos número foil y látex al mayoreo. Dígitos del 0 al 9 en dorado, plateado y colores metalizados. Precios de mayoreo, envíos a toda la república.',
    canonical:   `${SITE_URL}/catalogo/globos-numero`,
  },
  '/catalogo/globos-foil': {
    title:       `Globos Foil Metalizados al Mayoreo | ${SITE_NAME}`,
    description: 'Globos foil metalizados al mayoreo: redondos, corazón, estrella y más. Precios escalonados para decoradores y revendedores. Envíos a México desde Uruapan.',
    canonical:   `${SITE_URL}/catalogo/globos-foil`,
  },
  '/catalogo/letras-foil': {
    title:       `Letras Foil al Mayoreo en Uruapan | ${SITE_NAME}`,
    description: 'Letras foil metalizadas al mayoreo. Alfabeto completo en dorado, plateado y colores. Perfectas para arcos y decoraciones de fiesta. Envíos a todo México.',
    canonical:   `${SITE_URL}/catalogo/letras-foil`,
  },
  '/catalogo/globos-personajes': {
    title:       `Globos de Personajes al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Globos de personajes de moda al mayoreo: superhéroes, princesas, animales y más. Catálogo actualizado constantemente. Envíos a todo México desde Uruapan.',
    canonical:   `${SITE_URL}/catalogo/globos-personajes`,
  },
  '/catalogo/globos-cumpleanos': {
    title:       `Globos de Cumpleaños al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Globos para cumpleaños al mayoreo: Happy Birthday, números, personajes y kits completos. Precios escalonados por volumen en Uruapan, Michoacán.',
    canonical:   `${SITE_URL}/catalogo/globos-cumpleanos`,
  },
  '/catalogo/globos-graduacion': {
    title:       `Globos de Graduación al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Globos y decoración para graduaciones al mayoreo. Birretes, diplomas y kits de temporada. Precios mayoreo para revendedores. Envíos a todo México.',
    canonical:   `${SITE_URL}/catalogo/globos-graduacion`,
  },
  '/catalogo/globos-helio': {
    title:       `Globos para Helio al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Globos aptos para helio al mayoreo: látex de alta calidad y foil metalizados. Para decoradores y revendedores. Envíos a toda la república desde Uruapan.',
    canonical:   `${SITE_URL}/catalogo/globos-helio`,
  },
  '/catalogo/sets-globos': {
    title:       `Sets de Globos al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Sets y kits de globos al mayoreo listos para decorar fiestas y eventos. Combos de 5 piezas, arcos y racimos. Precios mayoreo en Uruapan, envíos a México.',
    canonical:   `${SITE_URL}/catalogo/sets-globos`,
  },
  '/catalogo/guirnaldas': {
    title:       `Guirnaldas Decorativas al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Guirnaldas de papel, tela y plástico al mayoreo para fiestas y eventos. Gran variedad de colores y estilos. Mayoreo y menudeo en Uruapan, Michoacán.',
    canonical:   `${SITE_URL}/catalogo/guirnaldas`,
  },
  '/catalogo/cortinas-lluvia': {
    title:       `Cortinas de Lluvia al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Cortinas de lluvia metalizadas al mayoreo: flecos, panel backdrop y más. Todos los colores. Precios escalonados para decoradores en Uruapan y envíos a México.',
    canonical:   `${SITE_URL}/catalogo/cortinas-lluvia`,
  },
  '/catalogo/velas': {
    title:       `Velas para Fiesta al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Velas para pastel al mayoreo: números, letras, espirales y más. Para cumpleaños, XV años y bodas. Precios mayoreo en Uruapan, Michoacán.',
    canonical:   `${SITE_URL}/catalogo/velas`,
  },
  '/catalogo/accesorios-globos': {
    title:       `Accesorios para Globos al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Accesorios para globos al mayoreo: brillo Mega Shine, varillas, cintas, bases y bombas. Todo para decoradores profesionales en Uruapan. Envíos a México.',
    canonical:   `${SITE_URL}/catalogo/accesorios-globos`,
  },
  '/catalogo/letras-led': {
    title:       `Letras LED para Eventos al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Letras LED luminosas al mayoreo para bodas, XV años y eventos. Decoración impactante con iluminación. Venta en Uruapan con envíos a toda la república.',
    canonical:   `${SITE_URL}/catalogo/letras-led`,
  },
  '/catalogo/globos-revelacion': {
    title:       `Globos Revelación de Sexo al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Globos para revelación de sexo al mayoreo: bazucas con confeti rosa/azul y globos sorpresa. Para gender reveal en Uruapan y envíos a todo México.',
    canonical:   `${SITE_URL}/catalogo/globos-revelacion`,
  },
  '/catalogo/bazucas-confeti': {
    title:       `Bazucas de Confeti al Mayoreo Uruapan | ${SITE_NAME}`,
    description: 'Bazucas de confeti al mayoreo para fiestas y eventos especiales. Confeti metálico, papel y biodegradable. Precios de mayoreo en Uruapan, Michoacán.',
    canonical:   `${SITE_URL}/catalogo/bazucas-confeti`,
  },
  '/admin': {
    title:       `Administración | ${SITE_NAME}`,
    description: null,
    canonical:   null,
    robots:      'noindex, nofollow',
  },
  '/sucursales': {
    title:       `Sucursales en Uruapan | ${SITE_NAME}`,
    description: 'Visítanos en Uruapan, Michoacán. Suc. Francisco Villa (C. Francisco Villa 103, Centro) y Suc. Sol Naciente (Universo 117). Envíos a todo México y recolección en tienda.',
    canonical:   `${SITE_URL}/sucursales`,
  },
  '/como-funciona': {
    title:       `¿Cómo hacer un pedido? | ${SITE_NAME}`,
    description: 'Aprende cómo pedir al mayoreo en Full Party Uruapan en 4 pasos: navega el catálogo, agrega al carrito, revisa y envía por WhatsApp. Atención para decoradores y revendedores.',
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

function setPageMeta({ title, description, canonical, robots = PUBLIC_ROBOTS }) {
  if (title) document.title = title;

  const mDesc = document.querySelector('meta[name="description"]');
  if (mDesc) mDesc.setAttribute('content', description || '');

  const robotsMeta = document.querySelector('meta[name="robots"]');
  if (robotsMeta) robotsMeta.setAttribute('content', robots);

  const ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle && title) ogTitle.setAttribute('content', title);

  const ogDesc = document.querySelector('meta[property="og:description"]');
  if (ogDesc) ogDesc.setAttribute('content', description || '');

  const ogUrl = document.querySelector('meta[property="og:url"]');
  if (ogUrl) ogUrl.setAttribute('content', canonical || '');

  const twTitle = document.querySelector('meta[name="twitter:title"]');
  if (twTitle && title) twTitle.setAttribute('content', title);

  const twDesc = document.querySelector('meta[name="twitter:description"]');
  if (twDesc) twDesc.setAttribute('content', description || '');

  let canonicalEl = document.querySelector('link[rel="canonical"]');
  if (canonical && !canonicalEl) {
    canonicalEl = document.createElement('link');
    canonicalEl.rel = 'canonical';
    document.head.appendChild(canonicalEl);
  }
  if (canonical) canonicalEl.href = canonical;
  else canonicalEl?.remove();

  let hreflangEl = document.querySelector('link[rel="alternate"][hreflang="es-MX"]');
  if (canonical && !hreflangEl) {
    hreflangEl = document.createElement('link');
    hreflangEl.rel = 'alternate';
    hreflangEl.hreflang = 'es-MX';
    document.head.appendChild(hreflangEl);
  }
  if (canonical) hreflangEl.href = canonical;
  else hreflangEl?.remove();
}

function RouterEffects() {
  const location = useLocation();
  const navigate = useNavigate();
  const esRutaLanding = location.pathname === '/';

  useEffect(() => {
    if (!('scrollRestoration' in window.history)) return undefined;
    const previous = window.history.scrollRestoration;
    window.history.scrollRestoration = 'manual';

    return () => {
      window.history.scrollRestoration = previous;
    };
  }, []);

  useLayoutEffect(() => {
    if (!esRutaLanding || location.hash) return;

    const resetScroll = () => {
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
    };

    resetScroll();
    requestAnimationFrame(resetScroll);
    const timeoutId = setTimeout(resetScroll, 120);

    return () => clearTimeout(timeoutId);
  }, [esRutaLanding, location.hash, location.key]);

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
    if (path.startsWith('/blog/')) {
      const robotsMeta = document.querySelector('meta[name="robots"]');
      if (robotsMeta) robotsMeta.setAttribute('content', PUBLIC_ROBOTS);
      return;
    }
    const dynamicCatalogMeta = buildCatalogCategoryMeta(path, {
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
    });
    const meta =
      PAGE_META[path] ??
      (path.startsWith('/admin')   ? PAGE_META['/admin']   : null) ??
      dynamicCatalogMeta ??
      (path.startsWith('/catalogo')? PAGE_META['/catalogo']: null) ??
      PAGE_META['/'];
    setPageMeta(meta);
  }, [location.pathname]);

  useEffect(() => {
    const data = buildRouteStructuredData(location.pathname, {
      siteName: SITE_NAME,
      siteUrl: SITE_URL,
    });
    let script = document.getElementById('route-jsonld');

    if (!data) {
      script?.remove();
      return;
    }

    if (!script) {
      script = document.createElement('script');
      script.id = 'route-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(data).replace(/</g, '\\u003c');
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
        <AppErrorBoundary>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route
            path="/catalogo"
            element={
              <Suspense fallback={Spinner}>
                <PublicCatalogRoute />
              </Suspense>
            }
          />
          <Route
            path="/catalogo/:categoria"
            element={
              <Suspense fallback={Spinner}>
                <PublicCatalogRoute />
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
        </AppErrorBoundary>
      </LanguageProvider>
    </BrowserRouter>
  );
}
