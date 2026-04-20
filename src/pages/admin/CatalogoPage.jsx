import { lazy, Suspense, useEffect } from 'react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLanguage } from '../../hooks/useLanguage';
import PageHeader from '../../components/admin/PageHeader';

const AdminCatalogo = lazy(() => import('../../components/AdminCatalogo'));

export default function CatalogoPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();

  useEffect(() => {
    setBreadcrumb([t('admin.nav.catalog')]);
  }, [t, setBreadcrumb]);

  return (
    <>
      <PageHeader
        title={t('admin.catalog.title')}
        subtitle={t('admin.catalog.subtitle')}
      />
      <Suspense fallback={
        <div className="flex items-center justify-center py-16 gap-3">
          <div className="w-6 h-6 rounded-full border-[3px] border-admin-border border-t-fiesta-magenta animate-spin" />
          <span className="text-sm font-body font-bold text-admin-muted">{t('admin.catalog.loading')}</span>
        </div>
      }>
        <AdminCatalogo />
      </Suspense>
    </>
  );
}
