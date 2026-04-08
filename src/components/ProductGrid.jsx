import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';
import ProductoDetalleModal from './ProductoDetalleModal';
import { useInfiniteScroll } from '../hooks/useInfiniteScroll';

export default function ProductGrid({ productos, getCantidad, onAgregar, onReducir }) {
  const { visibleCount, sentinelRef, hayMas, cargando, reset } = useInfiniteScroll(productos.length);
  const [productoDetalle, setProductoDetalle] = useState(null);

  // Resetear a página 1 cada vez que cambie el array (filtros / búsqueda)
  useEffect(() => { reset(); }, [productos, reset]);

  const visibles = productos.slice(0, visibleCount);

  // ── Estado vacío ────────────────────────────────────────────────────────
  if (productos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center">
        <div className="text-5xl mb-4 animate-float">🎈</div>
        <h3 className="font-display text-2xl text-ink-500 mb-1">Sin resultados</h3>
        <p className="text-sm text-ink-400 font-body">
          No encontramos productos con ese criterio.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Grid de productos visibles */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] sm:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-2.5 sm:gap-3 lg:gap-5 p-3 sm:p-4 lg:p-0 animate-fade-in">
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

      {/* ── Zona centinela + indicadores ─────────────────────────────────── */}
      <div className="px-4 pb-2">

        {/* Spinner / texto de carga */}
        {cargando && (
          <div className="flex items-center justify-center gap-3 py-6 animate-fade-in">
            {/* Spinner CSS puro */}
            <div
              className="w-6 h-6 rounded-full border-[3px] border-ink-200"
              style={{
                borderTopColor: '#ff3dac',
                animation: 'spin 0.7s linear infinite',
              }}
            />
            <span className="text-sm font-body font-bold text-ink-400">
              Cargando más productos...
            </span>
          </div>
        )}

        {/* Contador + mensaje de fin */}
        {!cargando && !hayMas && productos.length > 12 && (
          <div className="flex flex-col items-center gap-1 py-5">
            <span className="text-lg">🎉</span>
            <p className="text-xs font-body font-bold text-ink-300">
              {productos.length} de {productos.length} productos
            </p>
          </div>
        )}

        {/* Elemento centinela invisible — el IntersectionObserver lo vigila */}
        {hayMas && !cargando && (
          <div ref={sentinelRef} className="h-4" aria-hidden="true" />
        )}
      </div>

      {/* Keyframe del spinner (inline para no depender de Tailwind) */}
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>

      <ProductoDetalleModal
        producto={productoDetalle}
        onCerrar={() => setProductoDetalle(null)}
        onAgregar={(producto) => {
          onAgregar(producto);
          setProductoDetalle(null);
        }}
      />
    </div>
  );
}
