import { useState, useMemo, useEffect } from 'react';
import { useProductos }      from './hooks/useProductos';
import { useCarrito }        from './hooks/useCarrito';
import { useToast }          from './components/ui/ToastProvider';
import { categorias as CATEGORIAS_CONFIG } from './data/productos';
import { useAnuncio }         from './hooks/useAnuncio';
import { useLanguage }        from './hooks/useLanguage';
import Header             from './components/Header';
import BuscadorFiltros    from './components/BuscadorFiltros';
import ModalFiltros       from './components/ModalFiltros';
import ProductGrid        from './components/ProductGrid';
import ProductosSkeleton  from './components/ProductosSkeleton';
import CarritoDrawer      from './components/CarritoDrawer';
import FloatingCartButton from './components/FloatingCartButton';
import RastreoPedido      from './components/RastreoPedido';
import RedesSociales      from './components/RedesSociales';
import SidebarFiltrosDesktop from './components/SidebarFiltrosDesktop';

export default function App({ temaOscuro, onToggleTema, isAdmin = false }) {
  // Data from Supabase
  const { productos, loading, error, refetch } = useProductos();
  const { mensaje: anuncioMsg, activo: anuncioActivo } = useAnuncio();
  const [isBannerDismissed, setIsBannerDismissed] = useState(false);

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [areFiltersOpen, setAreFiltersOpen] = useState(false);
  const [isTrackingOpen, setIsTrackingOpen] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

  const [activeFilters, setActiveFilters] = useState({
    categorias: [],
    marcas:     [],
    tamanios:   [],
  });

  const { items, total, cantidadTotal,
          agregarItem, reducirItem, eliminarItem, limpiarCarrito, getCantidad,
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

  useEffect(() => {
    const yaVioIntro = sessionStorage.getItem('fp_intro_v1') === '1';
    if (yaVioIntro) return;

    setShowIntro(true);
    const t = setTimeout(() => {
      setShowIntro(false);
      sessionStorage.setItem('fp_intro_v1', '1');
    }, 1850);

    return () => clearTimeout(t);
  }, []);

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
    setActiveFilters({ categorias: [], marcas: [], tamanios: [] });

  const filteredProducts = useMemo(() => {
    const filtered = productos.filter(p => {
      const query = searchQuery.toLowerCase();
      const matchesText = !searchQuery ||
        p.nombre.toLowerCase().includes(query) ||
        p.descripcion?.toLowerCase().includes(query) ||
        p.marca?.toLowerCase().includes(query)  ||
        p.tamano?.toLowerCase().includes(query);

      const matchesCategory =
        activeFilters.categorias.length === 0 || activeFilters.categorias.includes(p.categoria);
      const matchesBrand =
        activeFilters.marcas.length === 0 || (p.marca && activeFilters.marcas.includes(p.marca));
      const matchesSize =
        activeFilters.tamanios.length === 0 || (p.tamano && activeFilters.tamanios.includes(p.tamano));

      return matchesText && matchesCategory && matchesBrand && matchesSize;
    });

    return [...filtered].sort((a, b) => {
      const aNuevo = a.es_nuevo === true ? 1 : 0;
      const bNuevo = b.es_nuevo === true ? 1 : 0;
      if (aNuevo !== bNuevo) return bNuevo - aNuevo;
      return String(a.nombre || '').localeCompare(String(b.nombre || ''));
    });
  }, [productos, searchQuery, activeFilters]);

  // Build ordered category pill list from known config (only show if products exist with that category)
  const categoryPills = useMemo(() => {
    const usadas = new Set(productos.map(p => p.categoria).filter(Boolean));
    return CATEGORIAS_CONFIG.filter(c => usadas.has(c.id));
  }, [productos]);

  const singleActiveCategory =
    activeFilters.categorias.length === 1 ? activeFilters.categorias[0] : null;

  const selectCategoryPill = (catId) => {
    if (catId === null) {
      setActiveFilters(prev => ({ ...prev, categorias: [] }));
    } else {
      setActiveFilters(prev => ({ ...prev, categorias: [catId] }));
    }
  };

  const activeFilterCount =
    activeFilters.categorias.length + activeFilters.marcas.length + activeFilters.tamanios.length;

  // Render
  // Full-screen tracking view
  if (isTrackingOpen) {
    return <RastreoPedido onCerrar={() => setIsTrackingOpen(false)} />;
  }

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden transition-colors duration-300 ${temaOscuro ? 'bg-[#0f1124]' : 'bg-cream'}`}>
      {showIntro && (
        <div className="fp-intro-overlay">
          <div className="fp-intro-glow" />
          <div className="fp-intro-card">
            <img src="/icons/icon-512.png" alt={import.meta.env.VITE_NOMBRE_NEGOCIO || 'Mi Tienda'} className="fp-intro-logo" />
            <h2 className="fp-intro-title">{t('intro.title')}</h2>
            <p className="fp-intro-subtitle">{t('intro.subtitle')}</p>
          </div>
        </div>
      )}

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
              busqueda={searchQuery}
              setBusqueda={setSearchQuery}
              filtros={activeFilters}
              toggleFiltro={toggleFilter}
              totalFiltrosActivos={activeFilterCount}
              onAbrirFiltros={() => setAreFiltersOpen(true)}
            />
          </div>

          {/* Category pills: quick access on mobile only */}
          {categoryPills.length > 0 && !loading && (
            <div className="lg:hidden overflow-x-auto hide-scrollbar pb-2 pt-1.5">
              <div className="flex gap-2 px-4">
                <button
                    onClick={() => selectCategoryPill(null)}
                  className="flex-shrink-0 text-[11px] font-body font-black px-3 py-1.5 rounded-full
                             transition-all duration-200 active:scale-95 whitespace-nowrap"
                  style={activeFilters.categorias.length === 0
                    ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)', color: 'white', boxShadow: '0 2px 8px #ff3dac44' }
                    : { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)' }
                  }
                >
                  {t('common.all')}
                </button>
                {categoryPills.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => selectCategoryPill(cat.id)}
                    className="flex-shrink-0 text-[11px] font-body font-black px-3 py-1.5 rounded-full
                               transition-all duration-200 active:scale-95 whitespace-nowrap"
                    style={singleActiveCategory === cat.id
                      ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)', color: 'white', boxShadow: '0 2px 8px #ff3dac44' }
                      : { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)' }
                    }
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </header>

        {/* Customer announcement banner */}
        {anuncioActivo && anuncioMsg && !isBannerDismissed && (
          <div
            className="relative overflow-hidden text-center font-body font-black"
            style={{
              background: 'linear-gradient(90deg, #1d4ed8, #2563eb, #4f46e5, #1d4ed8)',
              backgroundSize: '300% 100%',
              animation: 'bannerSlideDown 0.4s ease-out, bannerShimmer 8s linear infinite',
              color: 'white',
            }}
          >
            <div className="flex items-center justify-center gap-2 px-10 py-2.5">
              <span className="text-base" aria-hidden="true">📣</span>
              <span className="text-sm leading-snug">{anuncioMsg}</span>
            </div>
            <button
              onClick={() => setIsBannerDismissed(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                         rounded-full bg-white/20 text-white/80 hover:bg-white/30 hover:text-white
                         text-xs font-bold transition-all duration-200 active:scale-90"
              aria-label={t('announcements.closeAriaLabel')}
            >
              ✕
            </button>
          </div>
        )}

        <main className={`lg:pb-0 lg:h-[calc(100vh-130px)] lg:overflow-hidden transition-all duration-300 ${items.length > 0 ? 'pb-40' : 'pb-8'}`}>
          <div className="max-w-[1600px] mx-auto w-full px-3 lg:px-6 h-full">
            <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[300px_minmax(0,1fr)] 2xl:grid-cols-[340px_minmax(0,1fr)] lg:gap-6 xl:gap-8 lg:items-start lg:h-full">
              <SidebarFiltrosDesktop
                filtros={activeFilters}
                toggleFiltro={toggleFilter}
                limpiarFiltros={clearFilters}
                totalFiltrosActivos={activeFilterCount}
              />

              <section className="lg:h-full lg:flex lg:flex-col min-h-0">
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
                      style={{ color: 'var(--color-fiesta-purple, #a855f7)' }}
                    >
                      {t('trust.trackOrder')}
                    </button>
                  </div>
                </div>

                <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-16">
                  {loading && <ProductosSkeleton cantidad={8} />}

                  {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
                      <div className="text-5xl animate-float">😵</div>
                      <div className="bg-white rounded-3xl p-6 max-w-sm w-full"
                           style={{ border: '2px solid var(--border-default)', boxShadow: '0 4px 20px #ff3dac15' }}>
                        <p className="font-display text-lg text-ink-800 mb-1">{t('error.title')}</p>
                        <p className="text-xs font-body text-ink-400 mb-4 leading-relaxed">{error}</p>
                        <button
                          onClick={refetch}
                          className="w-full py-3 rounded-2xl font-body font-black text-sm text-white
                                     transition-all duration-200 active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)', boxShadow: '0 4px 14px #ff3dac44' }}
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
                    />
                  )}

                  <RedesSociales />
                </div>
              </section>
            </div>
          </div>
        </main>

        <FloatingCartButton
          cantidadTotal={cantidadTotal}
          total={total}
          onAbrir={() => setIsCartOpen(true)}
        />
      </div>

      <CarritoDrawer
        items={items}
        total={total}
        isOpen={isCartOpen}
        onCerrar={() => setIsCartOpen(false)}
        onAgregar={agregarItem}
        onReducir={reducirItem}
        onEliminar={eliminarItem}
        onLimpiar={limpiarCarrito}
        productos={productos}
      />

      <ModalFiltros
        isOpen={areFiltersOpen}
        onCerrar={() => setAreFiltersOpen(false)}
        filtros={activeFilters}
        toggleFiltro={toggleFilter}
        limpiarFiltros={clearFilters}
        totalResultados={filteredProducts.length}
      />
    </div>
  );
}
