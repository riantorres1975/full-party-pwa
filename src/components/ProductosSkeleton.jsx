/**
 * ProductosSkeleton — Cuadrícula de tarjetas fantasma mientras cargan los datos.
 * Mismo layout que ProductGrid para evitar layout shift.
 */
function TarjetaSkeleton() {
  return (
    <div className="skeleton-card min-h-[330px] overflow-hidden rounded-2xl bg-white lg:min-h-[300px]"
         style={{ border: '1px solid var(--border-soft)', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      {/* Imagen */}
      <div className="relative aspect-square overflow-hidden bg-ink-100 lg:aspect-[4/3]">
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
    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2.5 p-3 sm:grid-cols-[repeat(auto-fill,minmax(170px,1fr))] sm:gap-3 sm:p-4 lg:grid-cols-[repeat(auto-fill,minmax(195px,1fr))] lg:gap-4 lg:p-0 2xl:grid-cols-[repeat(auto-fill,minmax(210px,1fr))]">
      {Array.from({ length: cantidad }).map((_, i) => (
        <TarjetaSkeleton key={i} />
      ))}
    </div>
  );
}
