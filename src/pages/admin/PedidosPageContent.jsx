import { useLanguage } from '../../hooks/useLanguage';
import { SkeletonPedido } from '../../components/ui/Skeleton';
import { useAdminData } from '../../contexts/AdminDataContext';
import { ClipboardList } from 'lucide-react';
import PedidosTabs from './pedidos/components/PedidosTabs';
import DataErrorState from '../../components/admin/DataErrorState';

export default function PedidosPageContent() {
  const { t } = useLanguage();
  const { pedidos, loading, error, fetchPedidos } = useAdminData();

  return (
    <>
      <h2 className="sr-only">{t('admin.orders.management')}</h2>

      {/* Loading */}
      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-4 py-4">
          {[1,2,3].map(i => <SkeletonPedido key={i} />)}
        </div>
      )}

      {/* Error */}
      {error && (
        <DataErrorState message={error} onRetry={fetchPedidos} />
      )}

      {/* Content */}
      {!loading && !error && (
        <>
          {pedidos.length === 0 ? (
            <div className="min-h-[50vh] flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 rounded-full bg-purple-50 border-2 border-purple-100 flex items-center justify-center mb-3">
                <ClipboardList size={28} className="text-purple-300" />
              </div>
              <p className="font-body font-semibold text-xl text-admin-text-secondary">Todo al día</p>
              <p className="text-sm font-body text-admin-muted mt-1">
                {t('admin.orders.noActiveOrders')}
              </p>
            </div>
          ) : (
            <PedidosTabs />
          )}
        </>
      )}
    </>
  );
}
