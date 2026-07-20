import { useState, useEffect } from 'react';
import { Users, UserPlus, Copy, Check, Trash2, RefreshCw, Clock } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { usePermission } from '../../../hooks/usePermission';
import PageHeader from '../../../components/admin/PageHeader';
import { DataTable } from '../../../components/admin/DataTable';
import RoleBadge from '../../../components/admin/RoleBadge';
import UsuarioDetalleDrawer from './components/UsuarioDetalleDrawer';
import InvitarUsuarioModal from './components/InvitarUsuarioModal';
import { useUsuarios } from './hooks/useUsuarios';
import { usePendingInvites } from './hooks/usePendingInvites';
import { useConfirm } from '../../../hooks/useConfirm';
import ConfirmModal from '../../../components/ui/ConfirmModal';

function UsuarioAvatar({ profile }) {
  const initials = (profile.nombre || profile.email || '?').charAt(0).toUpperCase();
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-fiesta-magenta to-fiesta-cyan flex items-center justify-center text-white text-xs font-body font-bold shrink-0">
        {initials}
      </div>
      <div className="min-w-0">
        {profile.nombre && (
          <p className="text-xs font-body font-bold text-admin-text truncate">{profile.nombre}</p>
        )}
        <p className="text-sm font-body text-admin-text truncate">{profile.email}</p>
      </div>
    </div>
  );
}

function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function timeLeft(iso) {
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return 'expirado';
  const hrs = Math.floor(diff / 3600000);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function PendingInvitesSection({ invites, loading, onResend, onCancel, t }) {
  const [copiedEmail, setCopiedEmail] = useState(null);

  if (loading || invites.length === 0) return null;

  const handleResend = async (email, role) => {
    const url = await onResend(email, role);
    if (url) {
      setCopiedEmail(email);
      setTimeout(() => setCopiedEmail(null), 2000);
    }
  };

  return (
    <div className="mt-8">
      <div className="flex items-center gap-2 mb-4">
        <Clock size={16} className="text-admin-muted" />
        <h2 className="text-sm font-body font-bold text-admin-text uppercase tracking-wide">
          {t('admin.users.pending.title')}
        </h2>
        <span className="text-xs font-body text-admin-muted bg-admin-elevated px-2 py-0.5 rounded-full">
          {invites.length}
        </span>
      </div>

      <div className="rounded-xl border border-admin-border overflow-hidden">
        <table className="w-full text-sm font-body">
          <thead>
            <tr className="border-b border-admin-border bg-admin-elevated">
              <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide">
                {t('usuarios.email')}
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide hidden sm:table-cell">
                {t('usuarios.role')}
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide hidden md:table-cell">
                {t('admin.users.pending.invitedAgo').replace('{time}', '')}
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-admin-muted uppercase tracking-wide hidden md:table-cell">
                {t('admin.users.pending.expiresIn').replace('{time}', '')}
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {invites.map((inv) => (
              <tr key={inv.email} className="border-b border-admin-border last:border-0 hover:bg-admin-elevated/50 transition-colors">
                <td className="px-4 py-3 text-admin-text truncate max-w-[180px]">{inv.email}</td>
                <td className="px-4 py-3 hidden sm:table-cell">
                  <RoleBadge role={inv.role} />
                </td>
                <td className="px-4 py-3 text-admin-muted hidden md:table-cell">
                  {t('admin.users.pending.invitedAgo').replace('{time}', timeAgo(inv.invited_at))}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span className={`text-xs font-bold ${
                    timeLeft(inv.expires_at) === 'expirado' ? 'text-red-500' : 'text-admin-muted'
                  }`}>
                    {t('admin.users.pending.expiresIn').replace('{time}', timeLeft(inv.expires_at))}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      type="button"
                      onClick={() => handleResend(inv.email, inv.role)}
                      title={t('admin.users.invite.resend')}
                      className="p-1.5 rounded-lg text-admin-muted hover:text-fiesta-magenta hover:bg-admin-elevated transition-colors"
                    >
                      {copiedEmail === inv.email
                        ? <Check size={14} className="text-emerald-500" />
                        : <RefreshCw size={14} />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => onCancel(inv.email)}
                      title={t('admin.users.invite.cancel')}
                      className="p-1.5 rounded-lg text-admin-muted hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function UsuariosPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const canManage = usePermission('usuarios.manage');
  const { usuarios, loading, error, refetch, updateRole, toggleActivo } = useUsuarios();
  const { invites, loading: loadingInvites, refetch: refetchInvites, resend, cancel } = usePendingInvites();
  const [detalle, setDetalle] = useState(null);
  const [invitarOpen, setInvitarOpen] = useState(false);
  const { isOpen, config, confirm, onConfirm, onCancel } = useConfirm();

  useEffect(() => {
    setBreadcrumb([t('admin.users.title')]);
  }, [setBreadcrumb, t]);

  const handleCancelInvite = async (email) => {
    const accepted = await confirm({
      title: t('admin.users.invite.cancel'),
      message: t('admin.users.invite.cancelConfirm'),
      confirmLabel: t('admin.users.invite.cancel'),
      variant: 'danger',
    });
    if (accepted) await cancel(email);
  };

  const handleToggleActivo = async (id, currentActivo) => {
    if (currentActivo) {
      const accepted = await confirm({
        title: t('usuarios.deactivateUser'),
        message: t('usuarios.deactivateConfirm'),
        confirmLabel: t('usuarios.deactivateUser'),
        variant: 'danger',
      });
      if (!accepted) return false;
    }

    const updated = await toggleActivo(id, currentActivo);
    if (updated) {
      setDetalle((prev) => prev ? { ...prev, activo: !currentActivo } : null);
    }
    return updated;
  };

  const columns = [
    {
      key: 'email',
      label: t('usuarios.email'),
      sortable: true,
      searchable: true,
      render: (row) => <UsuarioAvatar profile={row} />,
    },
    {
      key: 'role',
      label: t('usuarios.role'),
      sortable: true,
      render: (row) => <RoleBadge role={row.role} />,
    },
    {
      key: 'activo',
      label: t('usuarios.status'),
      sortable: true,
      render: (row) =>
        row.activo
          ? <span className="text-xs font-body font-bold text-emerald-500">{t('usuarios.active')}</span>
          : <span className="text-xs font-body font-bold text-admin-muted">{t('usuarios.inactive')}</span>,
    },
    {
      key: 'created_at',
      label: t('usuarios.created'),
      sortable: true,
      format: 'relative',
    },
  ];

  return (
    <div>
      <PageHeader
        title={t('admin.users.title')}
        subtitle={t('admin.users.subtitle')}
        actions={
          canManage && (
            <button
              onClick={() => setInvitarOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-fiesta-magenta text-white text-sm font-body font-bold hover:opacity-90 transition-opacity"
            >
              <UserPlus size={15} />
              {t('admin.users.invite')}
            </button>
          )
        }
      />

      <DataTable
        data={usuarios}
        loading={loading}
        error={error}
        columns={columns}
        rowKey="id"
        onRowClick={(row) => setDetalle(row)}
        searchable
        searchPlaceholder={t('usuarios.buscar')}
        onRetry={refetch}
        emptyState={{
          icon: Users,
          title: t('usuarios.vacio.titulo'),
          description: t('usuarios.vacio.desc'),
        }}
      />

      {canManage && (
        <PendingInvitesSection
          invites={invites}
          loading={loadingInvites}
          onResend={resend}
          onCancel={handleCancelInvite}
          t={t}
        />
      )}

      {detalle && (
        <UsuarioDetalleDrawer
          usuario={detalle}
          onClose={() => setDetalle(null)}
          onUpdateRole={async (id, role) => {
            const updated = await updateRole(id, role);
            if (updated) setDetalle((prev) => prev ? { ...prev, role } : null);
          }}
          onToggleActivo={handleToggleActivo}
        />
      )}

      {invitarOpen && (
        <InvitarUsuarioModal
          onClose={() => setInvitarOpen(false)}
          onInvited={() => { refetch(); refetchInvites(); }}
        />
      )}

      <ConfirmModal
        open={isOpen}
        {...config}
        onConfirm={onConfirm}
        onCancel={onCancel}
      />
    </div>
  );
}
