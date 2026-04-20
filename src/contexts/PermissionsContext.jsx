import { createContext, useContext, useMemo, useState, useEffect } from 'react';
import { can, canAny, canAll } from '../lib/permissions';
import { ROLES } from '../lib/roles';
import { supabase } from '../lib/supabase';

const PermissionsContext = createContext();

export function PermissionsProvider({ children, user }) {
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchProfile() {
      if (!user?.id) {
        setRole(null);
        setProfile(null);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, email, nombre, role, activo')
          .eq('id', user.id)
          .single();

        if (cancelled) return;

        if (error || !data) {
          console.warn('[PermissionsContext] No se encontró profile, asumiendo viewer:', error?.message);
          setRole(ROLES.VIEWER);
          setProfile(null);
        } else if (!data.activo) {
          setRole(null);
          setProfile(data);
        } else {
          setRole(data.role);
          setProfile(data);
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[PermissionsContext] Error leyendo profile:', err);
        setRole(ROLES.VIEWER);
        setProfile(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchProfile();
    return () => { cancelled = true; };
  }, [user?.id]);

  const value = useMemo(() => ({
    role,
    profile,
    user,
    loading,
    can: (permission) => can(role, permission),
    canAny: (permissions) => canAny(role, permissions),
    canAll: (permissions) => canAll(role, permissions),
  }), [role, profile, user, loading]);

  return (
    <PermissionsContext.Provider value={value}>
      {children}
    </PermissionsContext.Provider>
  );
}

export function usePermissions() {
  const context = useContext(PermissionsContext);
  if (!context) {
    throw new Error('usePermissions must be used within PermissionsProvider');
  }
  return context;
}
