import { useState, useEffect, lazy, Suspense } from 'react';
import App         from './App';
import LandingPage from './pages/LandingPage';
import LoginAdmin  from './components/LoginAdmin';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './components/ui/ToastProvider';
import { LanguageProvider, useLanguage } from './hooks/useLanguage';

const AdminPedidos = lazy(() => import('./components/AdminPedidos'));

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

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
  const { session, user, cargandoSesion, loading, error, signIn, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const esRutaAdmin    = hash.startsWith('#/admin');
  const esRutaCatalogo = hash.startsWith('#/catalogo');
  const esRutaLanding  = !esRutaAdmin && !esRutaCatalogo;

  // Clases globales por ruta: forzar landing siempre en tema claro
  useEffect(() => {
    document.body.classList.toggle('catalogo', esRutaCatalogo);
    document.body.classList.toggle('landing-page', esRutaLanding);

    if (esRutaLanding) {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
      document.body.classList.remove('theme-dark');
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', '#fbf7f3');
    } else {
      document.documentElement.classList.toggle('dark', isDarkMode);
      document.documentElement.classList.toggle('light', !isDarkMode);
      document.body.classList.toggle('theme-dark', isDarkMode);
      const themeMeta = document.querySelector('meta[name="theme-color"]');
      if (themeMeta) themeMeta.setAttribute('content', isDarkMode ? '#0f1124' : '#fbf7f3');
    }

    return () => {
      document.body.classList.remove('catalogo');
      document.body.classList.remove('landing-page');
    };
  }, [esRutaCatalogo, esRutaLanding, isDarkMode]);

  return (
    <LanguageProvider>
      <AppRouterInner
        cargandoSesion={cargandoSesion}
        esRutaAdmin={esRutaAdmin}
        esRutaCatalogo={esRutaCatalogo}
        session={session}
        user={user}
        loading={loading}
        error={error}
        signIn={signIn}
        signOut={signOut}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
      />
    </LanguageProvider>
  );
}

function AppRouterInner({ cargandoSesion, esRutaAdmin, esRutaCatalogo, session, user, loading, error, signIn, signOut, isDarkMode, toggleTheme }) {
  const { t } = useLanguage();
  const [bootMinReady, setBootMinReady] = useState(false);

  useEffect(() => {
    const yaVioBoot = sessionStorage.getItem('fp_boot_v1') === '1';
    const delay = yaVioBoot ? 320 : 1650;
    const timer = setTimeout(() => {
      setBootMinReady(true);
      sessionStorage.setItem('fp_boot_v1', '1');
    }, delay);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!bootMinReady || cargandoSesion) return;

    const revealApp = () => {
      if (typeof window.__fpMarkAppReady === 'function') {
        window.__fpMarkAppReady();
      }
    };

    if (document.fonts?.ready) {
      document.fonts.ready
        .then(() => requestAnimationFrame(revealApp))
        .catch(() => requestAnimationFrame(revealApp));
      return;
    }

    requestAnimationFrame(revealApp);
  }, [bootMinReady, cargandoSesion]);

  // Spinner mientras Supabase verifica la sesión
  if (cargandoSesion) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #1a0733, #3d1a6e)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
          <p className="text-sm font-body text-purple-400">{t('login.verifyingSession')}</p>
        </div>
      </div>
    );
  }

  // Ruta de admin
  if (esRutaAdmin) {
    if (!session) {
      return (
        <ToastProvider>
          <LoginAdmin onLogin={signIn} loading={loading} error={error} />
        </ToastProvider>
      );
    }
    const emailUsuario = user?.email?.toLowerCase() || '';
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(emailUsuario)) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0733, #3d1a6e)' }}>
          <div className="text-center space-y-3 p-8">
            <p className="text-lg font-bold text-red-400">{t('login.accessDenied')}</p>
            <p className="text-sm text-purple-300">{t('login.noPermission')}</p>
            <button onClick={async () => { await signOut(); window.location.hash = ''; }} className="text-sm underline text-purple-400 hover:text-purple-200 transition-colors">{t('login.signOut')}</button>
          </div>
        </div>
      );
    }
    return (
      <ToastProvider>
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
            <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
          </div>
        }>
          <AdminPedidos
            user={user}
            temaOscuro={isDarkMode}
            onToggleTema={toggleTheme}
            onSignOut={async () => {
              await signOut();
              window.location.hash = '';
            }}
          />
        </Suspense>
      </ToastProvider>
    );
  }

  // Ruta catálogo
  if (esRutaCatalogo) {
    return (
      <ToastProvider>
        <App temaOscuro={isDarkMode} onToggleTema={toggleTheme} isAdmin={!!session} />
      </ToastProvider>
    );
  }

  // Ruta raíz → Landing Page
  return <LandingPage />;
}
