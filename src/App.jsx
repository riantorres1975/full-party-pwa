import { useState, useMemo, useEffect, useRef } from 'react';
import { useProductos }      from './hooks/useProductos';
import { useCarrito }        from './hooks/useCarrito';
import { useToast }          from './components/ui/ToastProvider';
import { categorias as CATEGORIAS_CONFIG } from './data/productos';
import { useAnuncio }         from './hooks/useAnuncio';
import { usePedidosHabilitados } from './hooks/usePedidosHabilitados';
import { useLanguage }        from './hooks/useLanguage';
import Header             from './components/Header';
import BuscadorFiltros    from './components/BuscadorFiltros';
import ModalFiltros       from './components/ModalFiltros';
import ProductGrid        from './components/ProductGrid';
import ProductosSkeleton  from './components/ProductosSkeleton';
import CarritoDrawer      from './components/CarritoDrawer';
import RastreoPedido      from './components/RastreoPedido';
import RedesSociales      from './components/RedesSociales';
import SidebarFiltrosDesktop from './components/SidebarFiltrosDesktop';
import CategoryGrid, { CategoryGridSkeleton } from './components/CategoryGrid';
import CategoryBrowser from './components/CategoryBrowser';
import BottomNav from './components/BottomNav';
import CatalogToolbar from './components/CatalogToolbar';
import { fuzzySearch } from './utils/fuzzySearch';

const PRODUCT_SEARCH_KEYS = [
  { name: 'nombre', weight: 0.5 },
  { name: 'descripcion', weight: 0.2 },
  { name: 'categoria', weight: 0.15 },
  { name: 'marca', weight: 0.1 },
  { name: 'tamano', weight: 0.05 },
];

export default function App({ temaOscuro, onToggleTema, isAdmin = false }) {
  // Data from Supabase
  const {
    productos,
    loading,
    error,
    usingCachedData,
    isInitialSyncing,
    refetch,
  } = useProductos();
  const { mensaje: anuncioMsg, activo: anuncioActivo } = useAnuncio(true);
  const { pedidosHabilitados } = usePedidosHabilitados(true);
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [isCategoryBrowserOpen, setIsCategoryBrowserOpen] = useState(false);
  const [bottomNavActive, setBottomNavActive] = useState('inicio');
  const [sortOrder, setSortOrder] = useState('featured');
  const searchRef = useRef(null);

  const [activeFilters, setActiveFilters] = useState({
    categorias: [],
    marcas:     [],
    tamanios:   [],
    precioMin:  null,
    precioMax:  null,
  });

  const { items, total, cantidadTotal,
          agregarItem, reducirItem, limpiarCarrito, getCantidad,
          stockError, sincronizarStock,
  } = useCarrito();

  const toast = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (stockError) toast.warning(stockError);
  }, [stockError]);

  // Keep cart in sync when products update in realtime
  useEffect(() => {
    if (productos.length > 0) sincronizarStock(productos);
  }, [productos, sincronizarStock]);

  // Filter logic
  const toggleFilter = (dimension, valor) => {
    setActiveFilters(prev => {
      const actual = prev[dimension];
      return {
        ...prev,
        [dimension]: actual.includes(valor)
          ? actual.filter(v => v !== valor)
          : [...actual, valor],
      };
    });
  };

  const clearFilters = () =>
    setActiveFilters({ categorias: [], marcas: [], tamanios: [], precioMin: null, precioMax: null });

  const setPriceFilter = ({ min, max }) => {
    setActiveFilters(prev => ({
      ...prev,
      precioMin: min,
      precioMax: max,
    }));
  };

  const priceBounds = useMemo(() => {
    const prices = productos
      .filter(p => p.activo !== false)
      .map(p => Number(p.precio))
      .filter(price => Number.isFinite(price) && price >= 0);

    if (prices.length === 0) return { min: null, max: null };
    return { min: Math.min(...prices), max: Math.max(...prices) };
  }, [productos]);

  const filteredProducts = useMemo(() => {
    const base = productos.filter(p => {
      const matchesCategory =
        activeFilters.categorias.length === 0 || activeFilters.categorias.includes(p.categoria);
      const matchesBrand =
        activeFilters.marcas.length === 0 || (p.marca && activeFilters.marcas.includes(p.marca));
      const matchesSize =
        activeFilters.tamanios.length === 0 || (p.tamano && activeFilters.tamanios.includes(p.tamano));
      const precio = Number(p.precio);
      const matchesPrice =
        (!Number.isFinite(activeFilters.precioMin) || precio >= activeFilters.precioMin) &&
        (!Number.isFinite(activeFilters.precioMax) || precio <= activeFilters.precioMax);

      return matchesCategory && matchesBrand && matchesSize && matchesPrice;
    });

    const query = searchQuery.trim();
    const matches = query
      ? fuzzySearch(base, query, PRODUCT_SEARCH_KEYS, { threshold: 0.38 })
      : base;

    return [...matches].sort((a, b) => {
      if (sortOrder === 'name-asc') {
        return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
      }
      if (sortOrder === 'price-asc') return (Number(a.precio) || 0) - (Number(b.precio) || 0);
      if (sortOrder === 'price-desc') return (Number(b.precio) || 0) - (Number(a.precio) || 0);

      const aNuevo = a.es_nuevo === true ? 1 : 0;
      const bNuevo = b.es_nuevo === true ? 1 : 0;
      if (aNuevo !== bNuevo) return bNuevo - aNuevo;
      return String(a.nombre || '').localeCompare(String(b.nombre || ''), 'es', { sensitivity: 'base' });
    });
  }, [productos, searchQuery, activeFilters, sortOrder]);

  // Build ordered category pill list from known config (only show if products exist with that category)
  const categoryPills = useMemo(() => {
    const usadas = new Set(productos.map(p => p.categoria).filter(Boolean));
    return CATEGORIAS_CONFIG.filter(c => usadas.has(c.id));
  }, [productos]);

  const categoryStats = useMemo(() => {
    const counts = new Map();
    const thumbs = new Map(); // representative product image per category
    productos
      .filter(p => p.activo !== false && p.categoria)
      .forEach((p) => {
        counts.set(p.categoria, (counts.get(p.categoria) || 0) + 1);
        if (!thumbs.has(p.categoria) && p.imagen_url) thumbs.set(p.categoria, p.imagen_url);
      });

    const labels = Object.fromEntries(CATEGORIAS_CONFIG.map(c => [c.id, c.label]));
    return [...counts.entries()]
      .map(([id, count]) => ({ id, label: labels[id] || id, count, imagen: thumbs.get(id) || null }))
      .sort((a, b) => {
        if (b.count !== a.count) return b.count - a.count;
        return String(a.label || '').localeCompare(String(b.label || ''), 'es', { sensitivity: 'base' });
      });
  }, [productos]);

  const topHomeCategories = useMemo(() => categoryStats.slice(0, 9), [categoryStats]);
  const topBrowserCategories = useMemo(() => categoryStats.slice(0, 8), [categoryStats]);

  const scrollCatalogTop = () => {
    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const selectCategory = (categoryOrId) => {
    const catId = typeof categoryOrId === 'string' ? categoryOrId : categoryOrId?.id;
    if (!catId) {
      setActiveFilters(prev => ({ ...prev, categorias: [] }));
    } else {
      setActiveFilters(prev => ({ ...prev, categorias: [catId] }));
    }
    setSearchQuery('');
    setIsCategoryBrowserOpen(false);
    setBottomNavActive('categorias');
    scrollCatalogTop();
  };

  const resetCatalog = () => {
    setSearchQuery('');
    clearFilters();
    setIsCategoryBrowserOpen(false);
    setBottomNavActive('inicio');
    scrollCatalogTop();
  };

  const focusSearch = () => {
    setIsCategoryBrowserOpen(false);
    setBottomNavActive('buscar');
    scrollCatalogTop();
    setTimeout(() => searchRef.current?.focus(), 180);
  };

  const activeFilterCount =
    activeFilters.categorias.length +
    activeFilters.marcas.length +
    activeFilters.tamanios.length +
    (Number.isFinite(activeFilters.precioMin) || Number.isFinite(activeFilters.precioMax) ? 1 : 0);

  // Render
  // Full-screen tracking view
  if (isTrackingOpen) {
    return <RastreoPedido onCerrar={() => setIsTrackingOpen(false)} />;
  }

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden transition-colors duration-300 ${temaOscuro ? 'bg-[#0f1124]' : 'bg-cream'}`}>
      <div className={temaOscuro ? 'theme-dark-catalog' : ''}>
        <header
          className={`sticky top-0 z-50 w-full backdrop-blur-md shadow-sm border-b pb-2 transition-colors duration-300 ${
            temaOscuro
              ? 'bg-[#0f1328]/86 border-[#2b2f52]'
              : 'bg-[#fbf7f3]/90 border-gray-100'
          }`}
        >
          <Header
            cantidadTotal={cantidadTotal}
            onAbrirCarrito={() => setIsCartOpen(true)}
            onRastreoClick={() => setIsTrackingOpen(true)}
            temaOscuro={temaOscuro}
            onToggleTema={onToggleTema}
            isAdmin={isAdmin}
          />

          <div className="pt-1">
            <BuscadorFiltros
              ref={searchRef}
              busqueda={searchQuery}
              setBusqueda={setSearchQuery}
              filtros={activeFilters}
              toggleFiltro={toggleFilter}
              totalFiltrosActivos={activeFilterCount}
              onAbrirFiltros={() => setAreFiltersOpen(true)}
              productos={productos}
              categoryStats={isInitialSyncing ? [] : categoryStats}
              onSelectCategory={selectCategory}
              priceBounds={priceBounds}
              onPrecioChange={setPriceFilter}
            />
          </div>
        </header>

        {/* Customer announcement banner */}
        {anuncioActivo && anuncioMsg && !isBannerDismissed && (
          <aside
            aria-label={t('announcements.bannerAriaLabel')}
            className="fixed bottom-[calc(4.5rem+env(safe-area-inset-bottom,0px))] left-3 right-3 z-[45] overflow-hidden rounded-2xl text-center font-body font-black lg:bottom-6 lg:left-auto lg:right-6 lg:w-full lg:max-w-xl"
            style={{
              background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7, #f97316)',
              backgroundSize: '300% 100%',
              animation: 'bannerSlideDown 0.4s ease-out, bannerShimmer 6s linear infinite, bannerPulseGlow 3s ease-in-out infinite',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
              boxShadow: '0 16px 40px rgba(76, 29, 149, 0.28)',
            }}
          >
            <div className="flex items-center justify-center gap-2 px-12 py-2.5">
              <span className="text-base animate-bounce" style={{ animationDuration: '2s' }}>📢</span>
              <span className="line-clamp-3 text-sm leading-snug">{anuncioMsg}</span>
            </div>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="absolute right-1 top-1/2 -translate-y-1/2 w-10 h-10 flex items-center justify-center
                         rounded-full bg-white/20 text-white/80 hover:bg-white/30 hover:text-white
                         text-xs font-bold transition-all duration-200 active:scale-90"
              aria-label={t('announcements.closeAriaLabel')}
            >
              ✕
            </button>
          </aside>
        )}

        {!pedidosHabilitados && (
          <div
            className="text-center font-body font-black px-4 py-2.5"
            style={{ background: 'linear-gradient(90deg, #ef4444, #dc2626)', color: 'white' }}
          >
            {t('cart.ordersPausedBanner')}
          </div>
        )}

        {usingCachedData && !error && (
          <div
            role="status"
            aria-live="polite"
            className="flex items-center justify-center gap-3 border-y border-amber-200 bg-amber-50 px-4 py-2 text-center font-body text-xs font-bold text-amber-900"
          >
            <span>{t('catalog.cachedData')}</span>
            <button
              type="button"
              onClick={refetch}
              className="min-h-10 flex-shrink-0 rounded-xl border border-amber-300 bg-white px-3 font-black text-amber-900 transition-colors hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-600"
            >
              {t('catalog.refresh')}
            </button>
          </div>
        )}

        <main className="pb-[calc(6.25rem+env(safe-area-inset-bottom,0px))] lg:pb-0 lg:h-[calc(100vh-130px)] lg:overflow-hidden transition-all duration-300">
          <h1 className="sr-only">Catálogo de Artículos para Fiesta al Mayoreo | Full Party Uruapan</h1>
          <div className="max-w-[1600px] mx-auto w-full px-3 lg:px-6 h-full">
            <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 xl:gap-8 lg:items-start lg:h-full">
              <SidebarFiltrosDesktop
                filtros={activeFilters}
                toggleFiltro={toggleFilter}
                limpiarFiltros={clearFilters}
                totalFiltrosActivos={activeFilterCount}
              />

              <section className="lg:h-full lg:flex lg:flex-col min-h-0">
                {(loading || isInitialSyncing) && !error && <CategoryGridSkeleton />}

                {!loading && !isInitialSyncing && !error && (
                  <CategoryGrid
                    categories={topHomeCategories}
                    totalCategories={categoryStats.length || categoryPills.length}
                    onSelectCategory={selectCategory}
                    onViewAll={() => {
                      setBottomNavActive('categorias');
                      setIsCategoryBrowserOpen(true);
                    }}
                  />
                )}

                 {/* Trust strip */}
                <div className="px-3 lg:px-0 pt-2 pb-1">
                  <div className="flex items-center justify-start lg:justify-center gap-3 lg:gap-5 text-[10px] lg:text-xs font-body font-bold overflow-x-auto hide-scrollbar"
                       style={{ color: 'var(--text-secondary)' }}>
                    <span className="whitespace-nowrap">{t('trust.shipping')}</span>
                    <span className="whitespace-nowrap">{t('trust.payOnDelivery')}</span>
                    <span className="whitespace-nowrap">{t('trust.whatsapp')}</span>
                    <button
                      onClick={() => setIsTrackingOpen(true)}
                      className="whitespace-nowrap ml-auto lg:hidden flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {t('trust.trackOrder')}
                    </button>
                  </div>
                </div>

                {!loading && !isInitialSyncing && !error && (
                  <CatalogToolbar
                    total={filteredProducts.length}
                    sortOrder={sortOrder}
                    onSortChange={setSortOrder}
                    isFiltered={searchQuery.trim().length > 0 || activeFilterCount > 0}
                    onClear={resetCatalog}
                  />
                )}

                <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-16">
                  {loading && <ProductosSkeleton cantidad={8} />}

                  {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
                      <div className="text-5xl animate-float">😵</div>
                      <div className="bg-white rounded-3xl p-6 max-w-sm w-full"
                           style={{ border: '2px solid var(--border-default)', boxShadow: 'var(--shadow-accent-soft)' }}>
                        <p className="font-display text-lg text-ink-800 mb-1">{t('error.title')}</p>
                        <p className="text-xs font-body text-ink-400 mb-4 leading-relaxed">{error}</p>
                        <button
                          onClick={refetch}
                          className="w-full py-3 rounded-2xl font-body font-black text-sm text-white
                                     transition-all duration-200 active:scale-95"
                          style={{ background: 'var(--gradient-accent)', boxShadow: 'var(--shadow-accent-soft)' }}
                        >
                          {t('error.retry')}
                        </button>
                      </div>
                    </div>
                  )}

                  {!loading && !error && (
                    <ProductGrid
                      productos={filteredProducts}
                      getCantidad={getCantidad}
                      onAgregar={agregarItem}
                      onReducir={reducirItem}
                      isFiltered={searchQuery.trim().length > 0 || activeFilterCount > 0}
                      onClear={resetCatalog}
                    />
                  )}

                  <RedesSociales />
                </div>
              </section>
            </div>
          </div>
        </main>

        <BottomNav
          active={isCartOpen ? 'pedido' : isCategoryBrowserOpen ? 'categorias' : bottomNavActive}
          cantidadTotal={cantidadTotal}
          onInicio={resetCatalog}
          onCategorias={() => {
            setBottomNavActive('categorias');
            setIsCategoryBrowserOpen(true);
          }}
          onBuscar={focusSearch}
          onPedido={() => setIsCartOpen(true)}
        />
      </div>

      <CarritoDrawer
        items={items}
        isOpen={isCartOpen}
        onCerrar={() => setIsCartOpen(false)}
        onAgregar={agregarItem}
        onReducir={reducirItem}
        onLimpiar={limpiarCarrito}
        productos={productos}
        pedidosHabilitados={pedidosHabilitados}
      />

      <ModalFiltros
        isOpen={areFiltersOpen}
        onCerrar={() => setAreFiltersOpen(false)}
        filtros={activeFilters}
        toggleFiltro={toggleFilter}
        onPrecioChange={setPriceFilter}
        priceBounds={priceBounds}
        limpiarFiltros={clearFilters}
        totalResultados={filteredProducts.length}
      />

      <CategoryBrowser
        isOpen={isCategoryBrowserOpen}
        categories={categoryStats}
        popularCategories={topBrowserCategories}
        onClose={() => setIsCategoryBrowserOpen(false)}
        onSelectCategory={selectCategory}
      />
    </div>
  );
}
