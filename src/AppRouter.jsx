import { useState, useEffect } from 'react';
import App         from './App';
import LoginAdmin  from './components/LoginAdmin';
import AdminPedidos from './components/AdminPedidos';
import { useAuth } from './hooks/useAuth';
import { useTheme } from './hooks/useTheme';

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
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return hash;
}

export default function AppRouter() {
  const hash = useHashRoute();
  const { session, user, cargandoSesion, loading, error, signIn, signOut } = useAuth();
  const { isDarkMode, toggleTheme } = useTheme();
  const esRutaAdmin = hash === '#/admin' || hash.startsWith('#/admin');

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
      return <LoginAdmin onLogin={signIn} loading={loading} error={error} />;
    }
    // Autenticado → Dashboard
    return (
      <AdminPedidos
        user={user}
        temaOscuro={isDarkMode}
        onToggleTema={toggleTheme}
        onSignOut={async () => {
          await signOut();
          window.location.hash = '';
        }}
      />
    );
  }

  // Ruta pública → catálogo normal
  return <App temaOscuro={isDarkMode} onToggleTema={toggleTheme} />;
}
