import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../../lib/supabase';
import { useToast } from '../../../../components/ui/ToastProvider';
import { useLanguage } from '../../../../hooks/useLanguage';
import { usePermissions } from '../../../../contexts/PermissionsContext';

export function usePendingInvites() {
  const [invites, setInvites] = useState([]);
  const [loading, setLoading] = useState(false);
  const toast = useToast();
  const { t } = useLanguage();
  const { user } = usePermissions();

  const fetchInvites = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles_pending')
        .select('email, role, token, invited_at, expires_at')
        .gt('expires_at', new Date().toISOString())
        .order('invited_at', { ascending: false });

      if (error) throw new Error(error.message);
      setInvites(data || []);
    } catch (err) {
      console.error('[usePendingInvites]', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInvites();
  }, [fetchInvites]);

  const resend = useCallback(async (email, role) => {
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

      await fetchInvites();
      return inviteUrl;
    } catch (err) {
      console.error('[usePendingInvites.resend]', err);
      toast.error(t('usuarios.invite.error'));
    }
  }, [user?.id, fetchInvites, toast, t]);

  const cancel = useCallback(async (email) => {
    try {
      const { error } = await supabase
        .from('profiles_pending')
        .delete()
        .eq('email', email);

      if (error) throw new Error(error.message);
      toast.success(t('usuarios.statusUpdated'));
      await fetchInvites();
    } catch (err) {
      console.error('[usePendingInvites.cancel]', err);
      toast.error(t('usuarios.updateError'));
    }
  }, [fetchInvites, toast, t]);

  return { invites, loading, refetch: fetchInvites, resend, cancel };
}
