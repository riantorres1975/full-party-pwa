import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import ProductCard from './ProductCard';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';
import { useLanguage } from '../hooks/useLanguage';
import { obtenerProductosRelacionados } from '../utils/productosRelacionados';
import { buildProductAnalyticsParams, trackEvent } from '../utils/analytics';
import RecentlyViewed from './RecentlyViewed';

const ProductoDetalleModal = lazy(() => import('./ProductoDetalleModal'));

export default function ProductGrid({
  productos,
  catalogProducts = productos,
  getCantidad,
  onAgregar,
  onReducir,
  isFiltered = false,
  onClear,
  isFavorite = () => false,
  onToggleFavorite,
  onViewProduct,
  recentProducts = [],
}) {
  const productSetKey = useMemo(
    // Appending background pages must not collapse the visible grid back to its
    // initial size. Filter and sort changes still alter this leading window.
    () => productos.slice(0, 16).map((producto) => String(producto.id)).join('|'),
    [productos],
  );
  const {
    visibleCount,
    sentinelRef,
    hayMas,
    cargando,
  } = useInfiniteScroll(productos.length, { resetKey: productSetKey });
  const [productoDetalle, setProductoDetalle] = useState(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const lastViewedProductRef = useRef(null);
  const scrollPositionRef = useRef(null);
  const { t } = useLanguage();
  const productId = searchParams.get('producto');

  useEffect(() => {
    if (!productId) {
      setProductoDetalle(null);
      return;
    }

    const linkedProduct = catalogProducts.find((producto) => String(producto.id) === productId);
    if (linkedProduct) setProductoDetalle(linkedProduct);
  }, [catalogProducts, productId]);

  useEffect(() => {
    if (!productoDetalle) {
      lastViewedProductRef.current = null;
      return;
    }
    if (lastViewedProductRef.current === productoDetalle.id) return;
    lastViewedProductRef.current = productoDetalle.id;
    trackEvent(
      'catalog_product_view',
      buildProductAnalyticsParams(productoDetalle),
    );
    onViewProduct?.(productoDetalle.id);
  }, [onViewProduct, productoDetalle]);

  const openProductDetail = (producto) => {
    if (!productoDetalle) {
      const scrollRoot = document.querySelector('[data-catalog-scroll-root]');
      scrollPositionRef.current = {
        catalog: scrollRoot?.scrollTop || 0,
        window: window.scrollY,
      };
    }
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
    requestAnimationFrame(() => {
      const scrollRoot = document.querySelector('[data-catalog-scroll-root]');
      const position = scrollPositionRef.current;
      if (!position) return;
      if (scrollRoot) scrollRoot.scrollTop = position.catalog;
      window.scrollTo({ top: position.window, behavior: 'auto' });
    });
  };

  const relatedProducts = useMemo(
    () => obtenerProductosRelacionados(catalogProducts, productoDetalle),
    [catalogProducts, productoDetalle],
  );

  const visibles = useMemo(
    () => productos.slice(0, visibleCount),
    [productos, visibleCount],
  );
  const isCatalogEmpty = catalogProducts.length === 0 && !isFiltered;

  const productDetail = productoDetalle && (
    <Suspense fallback={(
      <div
        className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/45 px-4 backdrop-blur-sm"
        role="status"
        aria-live="polite"
      >
        <div
          className="flex items-center gap-3 rounded-2xl px-5 py-4 font-body text-sm font-black"
          style={{ background: 'var(--surface-elevated)', color: 'var(--text-primary)', boxShadow: 'var(--shadow-accent-soft)' }}
        >
          <span
            className="h-5 w-5 rounded-full border-[3px] border-ink-200"
            style={{ borderTopColor: '#ff3dac', animation: 'spin 0.7s linear infinite' }}
            aria-hidden="true"
          />
          {t('product.loadingDetail')}
        </div>
      </div>
    )}>
      <ProductoDetalleModal
        producto={productoDetalle}
        cantidad={getCantidad(productoDetalle.id)}
        relacionados={relatedProducts}
        onCerrar={closeProductDetail}
        onAgregar={onAgregar}
        onReducir={onReducir}
        onSeleccionarRelacionado={openProductDetail}
        isFavorite={isFavorite(productoDetalle.id)}
        onToggleFavorite={onToggleFavorite}
      />
    </Suspense>
  );

  if (productos.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
          <div className="text-5xl mb-4 animate-float">🎈</div>
          <h3 className="font-display text-2xl text-ink-500 mb-1">
            {t(isCatalogEmpty ? 'grid.emptyCatalog' : 'grid.noResults')}
          </h3>
          <p className="text-sm text-ink-400 font-body mb-4">
            {t(isCatalogEmpty ? 'grid.emptyCatalogDesc' : 'grid.noResultsDesc')}
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
        {productDetail}
      </>
    );
  }

  return (
    <div className="w-full">
      {!isFiltered && (
        <RecentlyViewed products={recentProducts} onSelectProduct={openProductDetail} />
      )}

      <div id="catalog-product-grid" aria-busy={cargando} className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 p-3 animate-fade-in sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] sm:gap-3 sm:p-4 lg:grid-cols-[repeat(auto-fill,minmax(195px,1fr))] lg:gap-4 lg:p-0 2xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
        {visibles.map((producto, index) => (
          <ProductCard
            key={producto.id}
            producto={producto}
            index={index}
            cantidad={getCantidad(producto.id)}
            onAgregar={onAgregar}
            onReducir={onReducir}
            onAbrirDetalle={openProductDetail}
            isFavorite={isFavorite(producto.id)}
            onToggleFavorite={onToggleFavorite}
          />
        ))}
      </div>

      <div className="px-4 pb-2">
        {hayMas && (
          <p className="py-2 text-center text-xs font-body font-bold text-ink-400" aria-live="polite">
            {t('grid.ofProducts', { shown: visibles.length, total: productos.length })}
          </p>
        )}

        {!cargando && !hayMas && productos.length > 12 && (
          <div className="flex flex-col items-center gap-1 py-5">
            <span className="text-lg">🎉</span>
            <p className="text-xs font-body font-bold text-ink-300">
              {t('grid.allProductsLoaded')}
            </p>
          </div>
        )}

        {hayMas && (
          <div
            ref={sentinelRef}
            data-catalog-load-sentinel
            className="flex min-h-14 items-center justify-center py-2"
          >
            {cargando ? (
              <div className="flex items-center justify-center gap-3 animate-fade-in" role="status">
                <div
                  className="w-6 h-6 rounded-full border-[3px] border-ink-200"
                  style={{
                    borderTopColor: '#ff3dac',
                    animation: 'spin 0.7s linear infinite',
                  }}
                  aria-hidden="true"
                />
                <span className="text-sm font-body font-bold text-ink-400">
                  {t('grid.loadingMore')}
                </span>
              </div>
            ) : null}
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      {productDetail}
    </div>
  );
}
