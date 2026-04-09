import { useState, useEffect, lazy, Suspense } from 'react';
import App         from './App';
import LoginAdmin  from './components/LoginAdmin';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';
import { ToastProvider } from './components/ui/ToastProvider';

const AdminPedidos = lazy(() => import('./components/AdminPedidos'));

const ADMIN_EMAILS = (import.meta.env.VITE_ADMIN_EMAILS || '')
  .split(',')
  .map(e => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * AppRouter — enrutamiento por hash sin react-router.
 * /        → catálogo público
 * /#/admin → panel de admin (protegido)
 */
function useHashRoute() {
  const [hash, setHash] = useState(window.location.hash);
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
  const esRutaAdmin = hash.startsWith('#/admin');

  // Spinner mientras Supabase verifica la sesión
  if (cargandoSesion) {
    return (
      <div className="min-h-screen flex items-center justify-center"
           style={{ background: 'linear-gradient(135deg, #1a0733, #3d1a6e)' }}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-full border-[3px] border-purple-700 border-t-purple-300 animate-spin" />
          <p className="text-sm font-body text-purple-400">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  // Ruta de admin
  if (esRutaAdmin) {
    // No autenticado → Login
    if (!session) {
      return (
        <ToastProvider>
          <LoginAdmin onLogin={signIn} loading={loading} error={error} />
        </ToastProvider>
      );
    }
    // RBAC — si VITE_ADMIN_EMAILS está definido, verificar pertenencia
    const emailUsuario = user?.email?.toLowerCase() || '';
    if (ADMIN_EMAILS.length > 0 && !ADMIN_EMAILS.includes(emailUsuario)) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #1a0733, #3d1a6e)' }}>
          <div className="text-center space-y-3 p-8">
            <p className="text-lg font-bold text-red-400">Acceso denegado</p>
            <p className="text-sm text-purple-300">Tu cuenta no tiene permisos de administrador.</p>
            <button onClick={async () => { await signOut(); window.location.hash = ''; }} className="text-sm underline text-purple-400 hover:text-purple-200 transition-colors">Cerrar sesión</button>
          </div>
        </div>
      );
    }
    // Autenticado → Dashboard
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

  // Ruta pública → catálogo normal
  return (
    <ToastProvider>
      <App temaOscuro={isDarkMode} onToggleTema={toggleTheme} />
    </ToastProvider>
  );
}
