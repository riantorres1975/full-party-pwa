import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

/**
 * useAuth
 * Maneja sesión de Supabase Auth.
 * Retorna { session, user, loading, signIn, signOut }
 */
export function useAuth() {
  const [session, setSession] = useState(undefined); // undefined = cargando
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  // Leer sesión inicial y escuchar cambios
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signIn(email, password) {
    setLoading(true);
    setError('');
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    if (err) setError(err.message === 'Invalid login credentials'
      ? 'Email o contraseña incorrectos'
      : err.message);
    setLoading(false);
    return !err;
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return {
    session,                          // null = no autenticado, undefined = cargando
    user:    session?.user ?? null,
    cargandoSesion: session === undefined,
    loading,
    error,
    signIn,
    signOut,
  };
}
