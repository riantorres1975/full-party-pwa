import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import ProductoDetalleModal from './ProductoDetalleModal';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useLanguage } from '../hooks/useLanguage';

export default function ProductGrid({ productos, getCantidad, onAgregar, onReducir }) {
  const { visibleCount, sentinelRef, hayMas, cargando, reset } = useInfiniteScroll(productos.length);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const { t } = useLanguage();

  useEffect(() => { reset(); }, [productos, reset]);

  const visibles = productos.slice(0, visibleCount);

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="text-5xl mb-4 animate-float">🎈</div>
        <h3 className="font-display text-2xl text-ink-500 mb-1">{t('grid.noResults')}</h3>
        <p className="text-sm text-ink-400 font-body">
          {t('grid.noResultsDesc')}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-2.5 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-0 animate-fade-in">
        {visibles.map((producto, index) => (
          <ProductCard
            key={producto.id}
            producto={producto}
            index={index}
            cantidad={getCantidad(producto.id)}
            onAgregar={onAgregar}
            onReducir={onReducir}
            onAbrirDetalle={setProductoDetalle}
          />
        ))}
      </div>

      <div className="px-4 pb-2">
        {cargando && (
          <div className="flex items-center justify-center gap-3 py-6 animate-fade-in">
            <div
              className="w-6 h-6 rounded-full border-[3px] border-ink-200"
              style={{
                borderTopColor: '#ff3dac',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <span className="text-sm font-body font-bold text-ink-400">
              {t('grid.loadingMore')}
            </span>
          </div>
        )}

        {!cargando && !hayMas && productos.length > 12 && (
          <div className="flex flex-col items-center gap-1 py-5">
            <span className="text-lg">🎉</span>
            <p className="text-xs font-body font-bold text-ink-300">
              {t('grid.ofProducts', { shown: productos.length, total: productos.length })}
            </p>
          </div>
        )}

        {hayMas && !cargando && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <ProductoDetalleModal
        producto={productoDetalle}
        cantidad={productoDetalle ? getCantidad(productoDetalle.id) : 0}
        onCerrar={() => setProductoDetalle(null)}
        onAgregar={(producto) => {
          onAgregar(producto);
          setProductoDetalle(null);
        }}
      />
    </div>
  );
}
