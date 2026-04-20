import { useEffect, lazy, Suspense } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import '../catalog.css'; // Estilos exclusivos del catálogo/admin (dark-mode, etc.)
import App from '../App';
import LoginAdmin from '../components/LoginAdmin';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../hooks/useTheme';
import { ToastProvider } from '../components/ui/ToastProvider';
import { useLanguage } from '../hooks/useLanguage';

const AdminLayout = lazy(() => import('../layouts/AdminLayout'));
const AdminIndexRedirect = lazy(() => import('../components/admin/AdminIndexRedirect'));
const DashboardPage = lazy(() => import('../pages/admin/dashboard/DashboardPage'));
const PedidosPage = lazy(() => import('../pages/admin/PedidosPage'));
const CatalogoPage = lazy(() => import('../pages/admin/CatalogoPage'));
const ClientesPage = lazy(() => import('../pages/admin/clientes/ClientesPage'));

import ProtectedRoute from '../components/auth/ProtectedRoute';

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

export default function AuthCatalogRoutes() {
  const { session, user, cargandoSesion, loading, error, signIn, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();

  const esRutaAdmin = location.pathname.startsWith('/admin');

  useEffect(() => {
    document.body.classList.add('catalogo');
    document.body.classList.remove('landing-page');
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.classList.toggle('light', !isDarkMode);
    document.body.classList.toggle('theme-dark', isDarkMode);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDarkMode ? '#0f1124' : '#fbf7f3');

    return () => {
      document.body.classList.remove('catalogo');
      document.body.classList.remove('theme-dark');
    };
  }, [isDarkMode]);

  useEffect(() => {
    if (esRutaAdmin && cargandoSesion) return;

    const revealApp = () => {
      if (typeof window.__fpMarkAppReady === 'function') {
        window.__fpMarkAppReady();
      }
    };

    requestAnimationFrame(revealApp);
  }, [esRutaAdmin, cargandoSesion]);

  if (esRutaAdmin && cargandoSesion) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0733, #3d1a6e)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
          <p className="text-sm font-body text-purple-400">{t('login.verifyingSession')}</p>
        </div>
      </div>
    );
  }

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
            <button
              onClick={async () => {
                await signOut();
                navigate('/');
              }}
              className="text-sm underline text-purple-400 hover:text-purple-200 transition-colors"
            >
              {t('login.signOut')}
            </button>
          </div>
        </div>
      );
    }

    return (
      <ToastProvider>
        <Suspense
          fallback={
            <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--surface-primary)' }}>
              <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
            </div>
          }
        >
          <Routes>
            <Route
              path="/*"
              element={
                <AdminLayout
                  user={user}
                  temaOscuro={isDarkMode}
                  onToggleTema={toggleTheme}
                  onSignOut={async () => {
                    await signOut();
                    navigate('/');
                  }}
                >
                  <Routes>
                    <Route path="/" element={<AdminIndexRedirect />} />
                    <Route path="dashboard" element={
                      <ProtectedRoute permission="reportes.view" fallback="/admin/pedidos">
                        <DashboardPage />
                      </ProtectedRoute>
                    } />
                    <Route path="pedidos" element={<PedidosPage />} />
                    <Route path="catalogo" element={<CatalogoPage />} />
                    <Route path="clientes" element={
                      <ProtectedRoute permission="clientes.view" fallback="/admin/pedidos">
                        <ClientesPage />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<AdminIndexRedirect />} />
                  </Routes>
                </AdminLayout>
              }
            />
          </Routes>
        </Suspense>
      </ToastProvider>
    );
  }

  return (
    <ToastProvider>
      <App temaOscuro={isDarkMode} onToggleTema={toggleTheme} isAdmin={!!session} />
    </ToastProvider>
  );
}
