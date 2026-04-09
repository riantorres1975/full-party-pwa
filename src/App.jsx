import { useState, useMemo, useEffect } from 'react';
import { useProductos }      from './hooks/useProductos';
import { useCarrito }        from './hooks/useCarrito';
import { useToast }          from './components/ui/ToastProvider';
import { categorias as CATEGORIAS_CONFIG } from './data/productos';
import { useAnuncio }         from './hooks/useAnuncio';
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
  // ── Datos desde Supabase ───────────────────────────────────────────────────
  const { productos, loading, error, refetch } = useProductos();
  const { mensaje: anuncioMsg, activo: anuncioActivo } = useAnuncio();
  const [anuncioCerrado, setAnuncioCerrado] = useState(false);

  // ── UI state ───────────────────────────────────────────────────────────────
  const [busqueda,        setBusqueda]        = useState('');
  const [carritoAbierto,  setCarritoAbierto]  = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [rastreoAbierto,  setRastreoAbierto]  = useState(false);
  const [mostrarIntro, setMostrarIntro] = useState(false);

  const [filtros, setFiltros] = useState({
    categorias: [],
    marcas:     [],
    tamanios:   [],
  });

  const { items, total, cantidadTotal,
          agregarItem, reducirItem, eliminarItem, limpiarCarrito, getCantidad,
          stockError,
  } = useCarrito();

  const toast = useToast();

  useEffect(() => {
    if (stockError) toast.warning(stockError);
  }, [stockError]);

  useEffect(() => {
    const yaVioIntro = sessionStorage.getItem('fp_intro_v1') === '1';
    if (yaVioIntro) return;

    setMostrarIntro(true);
    const t = setTimeout(() => {
      setMostrarIntro(false);
      sessionStorage.setItem('fp_intro_v1', '1');
    }, 1850);

    return () => clearTimeout(t);
  }, []);

  // ── Lógica de filtros ──────────────────────────────────────────────────────
  const toggleFiltro = (dimension, valor) => {
    setFiltros(prev => {
      const actual = prev[dimension];
      return {
        ...prev,
        [dimension]: actual.includes(valor)
          ? actual.filter(v => v !== valor)
          : [...actual, valor],
      };
    });
  };

  const limpiarFiltros = () =>
    setFiltros({ categorias: [], marcas: [], tamanios: [] });

  const productosFiltrados = useMemo(() => {
    const filtrados = productos.filter(p => {
      const texto = busqueda.toLowerCase();
      const coincideTexto = !busqueda ||
        p.nombre.toLowerCase().includes(texto) ||
        p.descripcion?.toLowerCase().includes(texto) ||
        p.marca?.toLowerCase().includes(texto)  ||
        p.tamano?.toLowerCase().includes(texto);

      const coincideCategoria =
        filtros.categorias.length === 0 || filtros.categorias.includes(p.categoria);
      const coincideMarca =
        filtros.marcas.length === 0 || (p.marca && filtros.marcas.includes(p.marca));
      const coincideTamano =
        filtros.tamanios.length === 0 || (p.tamano && filtros.tamanios.includes(p.tamano));

      return coincideTexto && coincideCategoria && coincideMarca && coincideTamano;
    });

    return [...filtrados].sort((a, b) => {
      const aNuevo = a.es_nuevo === true ? 1 : 0;
      const bNuevo = b.es_nuevo === true ? 1 : 0;
      if (aNuevo !== bNuevo) return bNuevo - aNuevo;
      return String(a.nombre || '').localeCompare(String(b.nombre || ''));
    });
  }, [productos, busqueda, filtros]);

  // Build ordered category pill list from known config (only show if products exist with that category)
  const pillasCategorias = useMemo(() => {
    const usadas = new Set(productos.map(p => p.categoria).filter(Boolean));
    return CATEGORIAS_CONFIG.filter(c => usadas.has(c.id));
  }, [productos]);

  const categoriaActivaSola =
    filtros.categorias.length === 1 ? filtros.categorias[0] : null;

  const seleccionarCategoriaPill = (catId) => {
    if (catId === null) {
      setFiltros(prev => ({ ...prev, categorias: [] }));
    } else {
      setFiltros(prev => ({ ...prev, categorias: [catId] }));
    }
  };

  const totalFiltrosActivos =
    filtros.categorias.length + filtros.marcas.length + filtros.tamanios.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  // Vista de rastreo — pantalla completa
  if (rastreoAbierto) {
    return <RastreoPedido onCerrar={() => setRastreoAbierto(false)} />;
  }

  return (
    <div className={`min-h-screen lg:h-screen lg:overflow-hidden transition-colors duration-300 ${temaOscuro ? 'bg-[#0f1124]' : 'bg-cream'}`}>
      {mostrarIntro && (
        <div className="fp-intro-overlay">
          <div className="fp-intro-glow" />
          <div className="fp-intro-card">
            <img src="/icons/icon-512.png" alt="Full Party" className="fp-intro-logo" />
            <h2 className="fp-intro-title">Full PartyApp</h2>
            <p className="fp-intro-subtitle">Catalogo digital para tu fiesta</p>
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
            onAbrirCarrito={() => setCarritoAbierto(true)}
            onRastreoClick={() => setRastreoAbierto(true)}
            temaOscuro={temaOscuro}
            onToggleTema={onToggleTema}
            isAdmin={isAdmin}
          />

          <div className="pt-1">
            <BuscadorFiltros
              busqueda={busqueda}
              setBusqueda={setBusqueda}
              filtros={filtros}
              toggleFiltro={toggleFiltro}
              totalFiltrosActivos={totalFiltrosActivos}
              onAbrirFiltros={() => setFiltrosAbiertos(true)}
            />
          </div>

          {/* Pills de categorías — quick-access, solo mobile (sidebar lo cubre en desktop) */}
          {pillasCategorias.length > 0 && !loading && (
            <div className="lg:hidden overflow-x-auto hide-scrollbar pb-2 pt-1.5">
              <div className="flex gap-2 px-4">
                <button
                  onClick={() => seleccionarCategoriaPill(null)}
                  className="flex-shrink-0 text-[11px] font-body font-black px-3 py-1.5 rounded-full
                             transition-all duration-200 active:scale-95 whitespace-nowrap"
                  style={filtros.categorias.length === 0
                    ? { background: 'linear-gradient(135deg, #ff3dac, #a855f7)', color: 'white', boxShadow: '0 2px 8px #ff3dac44' }
                    : { background: 'var(--surface-card)', color: 'var(--text-secondary)', border: '1px solid var(--border-soft)' }
                  }
                >
                  Todos
                </button>
                {pillasCategorias.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => seleccionarCategoriaPill(cat.id)}
                    className="flex-shrink-0 text-[11px] font-body font-black px-3 py-1.5 rounded-full
                               transition-all duration-200 active:scale-95 whitespace-nowrap"
                    style={categoriaActivaSola === cat.id
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

        {/* ── Anuncio / Banner para clientes ── */}
        {anuncioActivo && anuncioMsg && !anuncioCerrado && (
          <div
            className="relative overflow-hidden text-center font-body font-black"
            style={{
              background: 'linear-gradient(90deg, #f97316, #ec4899, #a855f7, #f97316)',
              backgroundSize: '300% 100%',
              animation: 'bannerSlideDown 0.4s ease-out, bannerShimmer 6s linear infinite, bannerPulseGlow 3s ease-in-out infinite',
              color: 'white',
              textShadow: '0 1px 2px rgba(0,0,0,0.2)',
            }}
          >
            <div className="flex items-center justify-center gap-2 px-10 py-2.5">
              <span className="text-base animate-bounce" style={{ animationDuration: '2s' }}>📢</span>
              <span className="text-sm leading-snug">{anuncioMsg}</span>
            </div>
            <button
              onClick={() => setAnuncioCerrado(true)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center
                         rounded-full bg-white/20 text-white/80 hover:bg-white/30 hover:text-white
                         text-xs font-bold transition-all duration-200 active:scale-90"
              aria-label="Cerrar anuncio"
            >
              ✕
            </button>
          </div>
        )}

        <main className={`lg:pb-0 lg:h-[calc(100vh-130px)] lg:overflow-hidden transition-all duration-300 ${items.length > 0 ? 'pb-40' : 'pb-8'}`}>
          <div className="max-w-[1600px] mx-auto w-full px-3 lg:px-6 h-full">
            <div className="lg:grid lg:grid-cols-[230px_minmax(0,1fr)] lg:gap-6 xl:gap-8 lg:items-start lg:h-full">
              <SidebarFiltrosDesktop
                filtros={filtros}
                toggleFiltro={toggleFiltro}
                limpiarFiltros={limpiarFiltros}
                totalFiltrosActivos={totalFiltrosActivos}
              />

              <section className="lg:h-full lg:flex lg:flex-col min-h-0">
                {/* Strip de confianza */}
                <div className="px-3 lg:px-0 pt-2 pb-1">
                  <div className="flex items-center justify-start lg:justify-center gap-3 lg:gap-5 text-[10px] lg:text-xs font-body font-bold overflow-x-auto hide-scrollbar"
                       style={{ color: 'var(--text-secondary)' }}>
                    <span className="whitespace-nowrap">✓ Envío en Uruapan</span>
                    <span className="whitespace-nowrap">✓ Pago al recibir</span>
                    <span className="whitespace-nowrap">✓ Atención por WhatsApp</span>
                    <button
                      onClick={() => setRastreoAbierto(true)}
                      className="whitespace-nowrap ml-auto lg:hidden flex items-center gap-1 transition-colors"
                      style={{ color: 'var(--color-fiesta-purple, #a855f7)' }}
                    >
                      📦 Rastrear pedido
                    </button>
                  </div>
                </div>

                <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-4">
                  {loading && <ProductosSkeleton cantidad={8} />}

                  {!loading && error && (
                    <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
                      <div className="text-5xl animate-float">😵</div>
                      <div className="bg-white rounded-3xl p-6 max-w-sm w-full"
                           style={{ border: '2px solid var(--border-default)', boxShadow: '0 4px 20px #ff3dac15' }}>
                        <p className="font-display text-lg text-ink-800 mb-1">Ups, algo salió mal</p>
                        <p className="text-xs font-body text-ink-400 mb-4 leading-relaxed">{error}</p>
                        <button
                          onClick={refetch}
                          className="w-full py-3 rounded-2xl font-body font-black text-sm text-white
                                     transition-all duration-200 active:scale-95"
                          style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)', boxShadow: '0 4px 14px #ff3dac44' }}
                        >
                          🔄 Reintentar
                        </button>
                      </div>
                    </div>
                  )}

                  {!loading && !error && (
                    <ProductGrid
                      productos={productosFiltrados}
                      getCantidad={getCantidad}
                      onAgregar={agregarItem}
                      onReducir={reducirItem}
                    />
                  )}
                </div>

                <RedesSociales />
              </section>
            </div>
          </div>
        </main>

        <FloatingCartButton
          cantidadTotal={cantidadTotal}
          total={total}
          onAbrir={() => setCarritoAbierto(true)}
        />
      </div>

      <CarritoDrawer
        items={items}
        total={total}
        isOpen={carritoAbierto}
        onCerrar={() => setCarritoAbierto(false)}
        onAgregar={agregarItem}
        onReducir={reducirItem}
        onEliminar={eliminarItem}
        onLimpiar={limpiarCarrito}
      />

      <ModalFiltros
        isOpen={filtrosAbiertos}
        onCerrar={() => setFiltrosAbiertos(false)}
        filtros={filtros}
        toggleFiltro={toggleFiltro}
        limpiarFiltros={limpiarFiltros}
        totalResultados={productosFiltrados.length}
      />
    </div>
  );
}
