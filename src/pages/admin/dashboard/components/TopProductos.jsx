import { useLanguage } from '../../../../hooks/useLanguage';
import OptimizedImage from '../../../../components/OptimizedImage';

export default function TopProductos({ data, loading }) {
  const { t } = useLanguage();

  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-admin-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center py-8 bg-admin-elevated rounded-lg">
        <p className="text-admin-text-secondary">{t('admin.dashboard.chart.no_data')}</p>
      </div>
    );
  }

  const formatCurrency = (val) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(val);

  return (
    <div className="bg-admin-card border border-admin-border rounded-lg p-4 h-80 overflow-y-auto">
      <h3 className="text-sm font-body font-bold text-admin-text mb-3 sticky top-0 z-20 bg-admin-card py-1 border-b border-admin-border-soft">
        {t('admin.dashboard.chart.top_products')}
      </h3>
      <div className="space-y-3 pt-1">
        {data.map((producto, idx) => (
          <div key={producto.id || idx} className="border-b border-admin-border-soft pb-3 last:border-0">
            <div className="flex gap-3 items-start">
              {producto.imagen_url && (
                <OptimizedImage
                  src={producto.imagen_url}
                  alt={producto.nombre}
                  fallbackText={producto.nombre}
                  imgWidth={96}
                  containerClass="relative z-0 w-12 h-12 rounded border border-admin-border-soft bg-admin-elevated p-0.5 flex-shrink-0"
                  className="object-contain"
                />
              )}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-admin-text truncate">
                  {producto.nombre}
                </p>
                <div className="flex gap-2 text-xs text-admin-text-secondary mt-1">
                  <span>{producto.cantidad} unidades</span>
                  <span>•</span>
                  <span>{formatCurrency(producto.ingresos)}</span>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
