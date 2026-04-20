import { useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import { usePermissions } from '../../../../contexts/PermissionsContext';

export function useInvitarUsuario() {
  const toast = useToast();
  const { t } = useLanguage();
  const { user } = usePermissions();

  const invitar = useCallback(async (email, role) => {
    try {
      const { error: err } = await supabase
        .from('profiles_pending')
        .upsert({ email, role, invited_by: user?.id }, { onConflict: 'email' });

      if (err) throw new Error(err.message);

      const loginUrl = `${window.location.origin}/#/admin`;

      try {
        await navigator.clipboard.writeText(loginUrl);
        toast.success(t('admin.users.inviteCopied'));
      } catch {
        // clipboard denied — el modal mostrará el link de todas formas
      }

      toast.success(t('usuarios.invite.success'));
      return { ok: true, loginUrl };
    } catch (err) {
      console.error('[useInvitarUsuario]', err);
      toast.error(t('usuarios.invite.error'));
      return { ok: false };
    }
  }, [user?.id, toast, t]);

  return { invitar };
}
