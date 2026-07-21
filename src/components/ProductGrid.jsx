import { lazy, Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useLanguage } from '../hooks/useLanguage';
import { obtenerProductosRelacionados } from '../utils/productosRelacionados';

const ProductoDetalleModal = lazy(() => import('./ProductoDetalleModal'));

export default function ProductGrid({
  productos,
  catalogProducts = productos,
  getCantidad,
  onAgregar,
  onReducir,
  isFiltered = false,
  onClear,
}) {
  const { visibleCount, sentinelRef, hayMas, cargando, reset } = useInfiniteScroll(productos.length);
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const { t } = useLanguage();
  const productId = searchParams.get('producto');

  useEffect(() => { reset(); }, [productos, reset]);

  useEffect(() => {
    if (!productId) {
      setProductoDetalle(null);
      return;
    }

    const linkedProduct = catalogProducts.find((producto) => String(producto.id) === productId);
    if (linkedProduct) setProductoDetalle(linkedProduct);
  }, [catalogProducts, productId]);

  const openProductDetail = (producto) => {
    setProductoDetalle(producto);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('producto', String(producto.id));
    setSearchParams(nextParams);
  };

  const closeProductDetail = () => {
    setProductoDetalle(null);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('producto');
    setSearchParams(nextParams, { replace: true });
  };

  const relatedProducts = useMemo(
    () => obtenerProductosRelacionados(catalogProducts, productoDetalle),
    [catalogProducts, productoDetalle],
  );

  const visibles = useMemo(
    () => productos.slice(0, visibleCount),
    [productos, visibleCount],
  );

  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="text-5xl mb-4 animate-float">🎈</div>
        <h3 className="font-display text-2xl text-ink-500 mb-1">{t('grid.noResults')}</h3>
        <p className="text-sm text-ink-400 font-body mb-4">
          {t('grid.noResultsDesc')}
        </p>
        {isFiltered && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="px-5 py-2.5 rounded-2xl font-body font-black text-sm text-white transition-all duration-200 active:scale-95"
            style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-accent-soft)' }}
          >
            {t('grid.clearFilters')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(195px,1fr))] gap-2.5 sm:gap-3 lg:gap-4 p-3 sm:p-4 lg:p-0 animate-fade-in">
        {visibles.map((producto, index) => (
          <ProductCard
            key={producto.id}
            producto={producto}
            index={index}
            cantidad={getCantidad(producto.id)}
            onAgregar={onAgregar}
            onReducir={onReducir}
            onAbrirDetalle={openProductDetail}
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

      {productoDetalle && (
        <Suspense fallback={null}>
          <ProductoDetalleModal
            producto={productoDetalle}
            cantidad={getCantidad(productoDetalle.id)}
            relacionados={relatedProducts}
            onCerrar={closeProductDetail}
            onAgregar={onAgregar}
            onReducir={onReducir}
            onSeleccionarRelacionado={openProductDetail}
          />
        </Suspense>
      )}
    </div>
  );
}
