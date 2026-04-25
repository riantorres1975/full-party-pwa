import { useEffect } from 'react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLanguage } from '../../hooks/useLanguage';
import PageHeader from '../../components/admin/PageHeader';
import PedidosPageContent from './PedidosPageContent';

export default function PedidosPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();

  useEffect(() => {
    setBreadcrumb([t('admin.nav.orders')]);
  }, [t, setBreadcrumb]);

  return (
    <>
      <PageHeader
        title={t('admin.orders.management')}
        subtitle={t('admin.orders.subtitle')}
      />
      <PedidosPageContent />
    </>
  );
}
