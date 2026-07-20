/**
 * ProductosSkeleton — Cuadrícula de tarjetas fantasma mientras cargan los datos.
 * Mismo layout que ProductGrid para evitar layout shift.
 */
function TarjetaSkeleton() {
  return (
    <div className="skeleton-card bg-white rounded-2xl overflow-hidden"
         style={{ border: '1px solid var(--border-soft)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Imagen */}
      <div className="aspect-square bg-ink-100 relative overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      {/* Contenido */}
      <div className="p-2.5 sm:p-3 space-y-2">
        <div className="h-4 bg-ink-100 rounded-full w-4/5 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-3 bg-ink-100 rounded-full w-full relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-4 bg-ink-100 rounded-full w-1/3 mt-1 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-8 bg-ink-100 rounded-xl w-full mt-2 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}

export default function ProductosSkeleton({ cantidad = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-3 p-3 sm:p-4 max-w-7xl mx-auto">
      {Array.from({ length: cantidad }).map((_, i) => (
        <TarjetaSkeleton key={i} />
      ))}
    </div>
  );
}
