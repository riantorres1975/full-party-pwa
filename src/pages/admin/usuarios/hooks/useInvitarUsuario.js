import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import { usePermissions } from '../../../../contexts/PermissionsContext';

export function useInvitarUsuario() {
  const toast = useToast();
  const { t } = useLanguage();
  const { user } = usePermissions();

  const checkEmailExists = useCallback(async (email) => {
    const { data, error } = await supabase.rpc('check_email_exists', { p_email: email });
    if (error) throw new Error(error.message);
    return data === true;
  }, []);

  const invitar = useCallback(async (email, role) => {
    try {
      // Verificar si ya tiene cuenta en auth.users
      const exists = await checkEmailExists(email);
      if (exists) {
        return { ok: false, reason: 'emailExists' };
      }

      // Verificar si ya hay invitación pendiente vigente
      const { data: pending } = await supabase
        .from('profiles_pending')
        .select('token, expires_at')
        .eq('email', email)
        .maybeSingle();

      const ahora = new Date();
      if (pending && new Date(pending.expires_at) > ahora) {
        return { ok: false, reason: 'alreadyPending', pendingToken: pending.token };
      }

      // Crear o reemplazar invitación con token nuevo
      const token = crypto.randomUUID();
      const expiresAt = new Date(ahora.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error: upsertErr } = await supabase
        .from('profiles_pending')
        .upsert(
          { email, role, token, expires_at: expiresAt, invited_by: user?.id },
          { onConflict: 'email' }
        );

      if (upsertErr) throw new Error(upsertErr.message);

      const inviteUrl = `${window.location.origin}/admin/registro?token=${token}`;

      try {
        await navigator.clipboard.writeText(inviteUrl);
      } catch {
        // clipboard puede estar denegado — el modal muestra el link igualmente
      }

      return { ok: true, token, inviteUrl, role };
    } catch (err) {
      console.error('[useInvitarUsuario]', err);
      toast.error(t('usuarios.invite.error'));
      return { ok: false, reason: 'error' };
    }
  }, [user?.id, toast, t, checkEmailExists]);

  const reenviar = useCallback(async (email, role) => {
    try {
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { error } = await supabase
        .from('profiles_pending')
        .update({ token, expires_at: expiresAt, invited_by: user?.id })
        .eq('email', email);

      if (error) throw new Error(error.message);

      const inviteUrl = `${window.location.origin}/admin/registro?token=${token}`;

      try {
        await navigator.clipboard.writeText(inviteUrl);
        toast.success(t('admin.users.invite.linkCopied'));
      } catch {}

      return { ok: true, token, inviteUrl, role };
    } catch (err) {
      console.error('[useInvitarUsuario.reenviar]', err);
      toast.error(t('usuarios.invite.error'));
      return { ok: false };
    }
  }, [user?.id, toast, t]);

  return { invitar, reenviar };
}
