import { useEffect, useState } from 'react';
import '../catalog.css';
import App from '../App';
import { ToastProvider } from '../components/ui/ToastProvider';
import { useTheme } from '../hooks/useTheme';
import { supabase } from '../lib/supabase';

export default function PublicCatalogRoute() {
  const { isDarkMode, toggleTheme } = useTheme();
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (active) setHasSession(Boolean(data.session));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) setHasSession(Boolean(session));
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    document.body.classList.add('catalogo');
    document.body.classList.remove('landing-page');

    requestAnimationFrame(() => {
      window.__fpMarkAppReady?.();
    });

    return () => {
      document.body.classList.remove('catalogo');
      document.body.classList.remove('theme-dark');
    };
  }, []);

  return (
    <ToastProvider>
      <App
        temaOscuro={isDarkMode}
        onToggleTema={toggleTheme}
        isAdmin={hasSession}
      />
    </ToastProvider>
  );
}
