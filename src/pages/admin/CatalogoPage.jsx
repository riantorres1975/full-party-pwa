import { useEffect } from 'react';
import { Database, PackageOpen } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { useBreadcrumb } from '../../contexts/BreadcrumbContext';
import { useLanguage } from '../../hooks/useLanguage';
import PageHeader from '../../components/admin/PageHeader';
import AdminCatalogWorkspace from '../../components/admin/catalog-v2/AdminCatalogWorkspace';
import AdminProductsWorkspace from '../../components/admin/catalog-v2/AdminProductsWorkspace';

export default function CatalogoPage() {
  const { t } = useLanguage();
  const setBreadcrumb = useBreadcrumb();
  const [searchParams, setSearchParams] = useSearchParams();
  const baseMode = searchParams.get('vista') === 'base' || searchParams.has('seccion');

  useEffect(() => {
    setBreadcrumb([t('admin.nav.catalog')]);
  }, [t, setBreadcrumb]);

  return (
    <>
      <PageHeader
        title="Catalogo V2"
        subtitle="Administra la estructura normalizada que alimentara la nueva experiencia de compra."
        actions={(
          <div className="flex rounded-xl border border-admin-border bg-admin-card p-1">
            <button
              type="button"
              onClick={() => setSearchParams({ vista: 'productos' })}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${
                !baseMode ? 'bg-fiesta-magenta text-white' : 'text-admin-muted hover:bg-admin-elevated'
              }`}
            >
              <PackageOpen size={14} /> Productos
            </button>
            <button
              type="button"
              onClick={() => setSearchParams({ vista: 'base', seccion: 'categories' })}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-black ${
                baseMode ? 'bg-fiesta-magenta text-white' : 'text-admin-muted hover:bg-admin-elevated'
              }`}
            >
              <Database size={14} /> Datos base
            </button>
          </div>
        )}
      />
      {baseMode ? <AdminCatalogWorkspace /> : <AdminProductsWorkspace />}
    </>
  );
}
