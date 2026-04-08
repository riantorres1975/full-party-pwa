import { useState, useMemo, useEffect } from 'react';
import { useProductos }      from './hooks/useProductos';
import { useCarrito }        from './hooks/useCarrito';
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

export default function App({ temaOscuro, onToggleTema }) {
  // ── Datos desde Supabase ───────────────────────────────────────────────────
  const { productos, loading, error, refetch } = useProductos();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [busqueda,        setBusqueda]        = useState('');
  const [carritoAbierto,  setCarritoAbierto]  = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [rastreoAbierto,  setRastreoAbierto]  = useState(false);
  const [mostrarIntro, setMostrarIntro] = useState(false);
  const [hayActualizacion, setHayActualizacion] = useState(false);

  const [filtros, setFiltros] = useState({
    categorias: [],
    marcas:     [],
    tamanios:   [],
  });

  const { items, total, cantidadTotal,
          agregarItem, reducirItem, eliminarItem, limpiarCarrito, getCantidad,
  } = useCarrito();

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

  useEffect(() => {
    const onUpdate = () => setHayActualizacion(true);
    window.addEventListener('fp-sw-update', onUpdate);
    return () => window.removeEventListener('fp-sw-update', onUpdate);
  }, []);

  function aplicarActualizacion() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        } else {
          window.location.reload();
        }
      });
      return;
    }
    window.location.reload();
  }

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
            temaOscuro={temaOscuro}
            onToggleTema={onToggleTema}
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
        </header>

        <main className={`lg:pb-0 lg:h-[calc(100vh-130px)] lg:overflow-hidden transition-all duration-300 ${items.length > 0 ? 'pb-32' : 'pb-8'}`}>
          <div className="max-w-[1500px] mx-auto w-full px-4 lg:px-10 h-full">
            <div className="lg:grid lg:grid-cols-[260px_minmax(0,1fr)] lg:gap-8 xl:gap-10 lg:items-start lg:h-full">
              <SidebarFiltrosDesktop
                filtros={filtros}
                toggleFiltro={toggleFiltro}
                limpiarFiltros={limpiarFiltros}
                totalFiltrosActivos={totalFiltrosActivos}
              />

              <section className="lg:h-full lg:flex lg:flex-col min-h-0">
                {/* Barra superior del catálogo — rastreo */}
                <div className="px-3 lg:px-0 pb-2 w-full flex items-center gap-3">
                  <button
                    onClick={() => setRastreoAbierto(true)}
                    className="flex items-center gap-2 text-xs font-body font-bold px-3.5 py-2 rounded-xl transition-all duration-200 active:scale-95"
                    style={{
                      background: 'var(--surface-card)',
                      color: 'var(--text-secondary)',
                      border: '1px solid var(--border-soft)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                    }}
                  >
                    📦 Rastrear mi pedido
                  </button>
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

      {hayActualizacion && (
        <div className="fixed left-1/2 -translate-x-1/2 bottom-20 sm:bottom-6 z-[70] w-[92vw] max-w-md">
          <div
            className="rounded-2xl border-2 p-3 sm:p-3.5 shadow-xl backdrop-blur-sm"
            style={{
              background: 'var(--surface-primary)',
              borderColor: 'var(--border-default)',
            }}
          >
            <p className="font-body font-black text-sm text-ink-900">Nueva version disponible</p>
            <p className="text-xs font-body text-ink-500 mt-0.5">
              Actualiza para ver los ultimos cambios de Full PartyApp.
            </p>
            <div className="mt-2.5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setHayActualizacion(false)}
                className="px-3 py-1.5 rounded-full text-xs font-body font-black border-2 border-purple-100 text-ink-500"
              >
                Luego
              </button>
              <button
                type="button"
                onClick={aplicarActualizacion}
                className="px-3.5 py-1.5 rounded-full text-xs font-body font-black text-white"
                style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)' }}
              >
                Actualizar
              </button>
            </div>
          </div>
        </div>
      )}

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
