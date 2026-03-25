import { useState, useMemo } from 'react';
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

export default function App() {
  // ── Datos desde Supabase ───────────────────────────────────────────────────
  const { productos, loading, error, refetch } = useProductos();

  // ── UI state ───────────────────────────────────────────────────────────────
  const [busqueda,        setBusqueda]        = useState('');
  const [carritoAbierto,  setCarritoAbierto]  = useState(false);
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false);
  const [rastreoAbierto,  setRastreoAbierto]  = useState(false);

  const [filtros, setFiltros] = useState({
    categorias: [],
    marcas:     [],
    tamanios:   [],
  });

  const { items, total, cantidadTotal,
          agregarItem, reducirItem, eliminarItem, limpiarCarrito, getCantidad,
  } = useCarrito();

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
    return productos.filter(p => {
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
  }, [productos, busqueda, filtros]);

  const totalFiltrosActivos =
    filtros.categorias.length + filtros.marcas.length + filtros.tamanios.length;

  // ── Render ─────────────────────────────────────────────────────────────────
  // Vista de rastreo — pantalla completa
  if (rastreoAbierto) {
    return <RastreoPedido onCerrar={() => setRastreoAbierto(false)} />;
  }

  return (
    <div className="min-h-screen bg-cream lg:h-screen lg:overflow-hidden">
      <Header
        cantidadTotal={cantidadTotal}
        onAbrirCarrito={() => setCarritoAbierto(true)}
      />

      <div className="lg:sticky lg:top-[72px] lg:z-30 lg:backdrop-blur-sm lg:bg-cream/90">
        <BuscadorFiltros
          busqueda={busqueda}
          setBusqueda={setBusqueda}
          filtros={filtros}
          toggleFiltro={toggleFiltro}
          totalFiltrosActivos={totalFiltrosActivos}
          onAbrirFiltros={() => setFiltrosAbiertos(true)}
        />
      </div>

      <main className="pb-44 lg:pb-0 lg:h-[calc(100vh-148px)] lg:overflow-hidden">
        <div className="max-w-[1500px] mx-auto w-full px-4 lg:px-10 h-full">
          <div className="lg:grid lg:grid-cols-[290px_minmax(0,1fr)] lg:gap-12 lg:items-start lg:h-full">
            <SidebarFiltrosDesktop
              filtros={filtros}
              toggleFiltro={toggleFiltro}
              limpiarFiltros={limpiarFiltros}
              totalFiltrosActivos={totalFiltrosActivos}
            />

            <section className="lg:h-full lg:flex lg:flex-col min-h-0">
              {/* Botón rastrear pedido */}
              <div className="px-4 lg:px-0 pb-2 w-full">
                <button
                  onClick={() => setRastreoAbierto(true)}
                  className="flex items-center gap-2 text-xs font-body font-black
                             px-4 py-2 rounded-full transition-all duration-200 active:scale-95"
                  style={{ background: '#f3e8ff', color: '#6b35b8', border: '2px solid #e0c4f8' }}
                >
                  📦 Rastrear mi pedido
                </button>
              </div>

              <div className="lg:flex-1 lg:min-h-0 lg:overflow-y-auto lg:pr-1 lg:pb-4">
                {/* ── Estado de carga ── */}
                {loading && <ProductosSkeleton cantidad={8} />}

                {/* ── Estado de error ── */}
                {!loading && error && (
                  <div className="flex flex-col items-center justify-center py-20 px-8 text-center gap-4">
                    <div className="text-5xl animate-float">😵</div>
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full"
                         style={{ border: '2px solid #fecdd3', boxShadow: '0 4px 20px #ff3dac15' }}>
                      <p className="font-display text-lg text-ink-800 mb-1">
                        Ups, algo salió mal
                      </p>
                      <p className="text-xs font-body text-ink-400 mb-4 leading-relaxed">
                        {error}
                      </p>
                      <button
                        onClick={refetch}
                        className="w-full py-3 rounded-2xl font-body font-black text-sm text-white
                                   transition-all duration-200 active:scale-95"
                        style={{ background: 'linear-gradient(135deg, #ff3dac, #a855f7)',
                                 boxShadow: '0 4px 14px #ff3dac44' }}
                      >
                        🔄 Reintentar
                      </button>
                    </div>
                  </div>
                )}

                {/* ── Datos listos ── */}
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
