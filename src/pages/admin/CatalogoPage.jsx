import { useEffect } from 'react';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLanguage } from '../../hooks/useLanguage';
import PageHeader from '../../components/admin/PageHeader';
import AdminCatalogWorkspace from '../../components/admin/catalog-v2/AdminCatalogWorkspace';

export default function CatalogoPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();

  useEffect(() => {
    setBreadcrumb([t('admin.nav.catalog')]);
  }, [t, setBreadcrumb]);

  return (
    <>
      <PageHeader
        title="Catalogo V2"
        subtitle="Administra la estructura normalizada que alimentara la nueva experiencia de compra."
      />
      <AdminCatalogWorkspace />
    </>
  );
}
