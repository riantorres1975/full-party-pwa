import { useState } from 'react';
import { Users, UserPlus } from 'lucide-react';
import { useLanguage } from '../../../hooks/useLanguage';
import { useBreadcrumb } from '../../../contexts/BreadcrumbContext';
import { usePermission } from '../../../hooks/usePermission';
import { useEffect } from 'react';
import PageHeader from '../../../components/admin/PageHeader';
import { DataTable } from '../../../components/admin/DataTable';
import RoleBadge from '../../../components/admin/RoleBadge';
import UsuarioDetalleDrawer from './components/UsuarioDetalleDrawer';
import InvitarUsuarioModal from './components/InvitarUsuarioModal';
import { useUsuarios } from './hooks/useUsuarios';

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

export default function UsuariosPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const canManage = usePermission('usuarios.manage');
  const { usuarios, loading, error, refetch, updateRole, toggleActivo } = useUsuarios();
  const [detalle, setDetalle] = useState(null);
  const [invitarOpen, setInvitarOpen] = useState(false);

  useEffect(() => {
    setBreadcrumb([{ label: t('admin.users.title') }]);
  }, [setBreadcrumb, t]);

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

      {detalle && (
        <UsuarioDetalleDrawer
          usuario={detalle}
          onClose={() => setDetalle(null)}
          onUpdateRole={async (id, role) => {
            await updateRole(id, role);
            setDetalle((prev) => prev ? { ...prev, role } : null);
          }}
          onToggleActivo={async (id, current) => {
            await toggleActivo(id, current);
            setDetalle((prev) => prev ? { ...prev, activo: !current } : null);
          }}
        />
      )}

      {invitarOpen && (
        <InvitarUsuarioModal
          onClose={() => setInvitarOpen(false)}
          onInvited={refetch}
        />
      )}
    </div>
  );
}
