/**
 * ProductosSkeleton — Cuadrícula de tarjetas fantasma mientras cargan los datos.
 * Mismo layout que ProductGrid para evitar layout shift.
 */
function TarjetaSkeleton() {
  return (
    <div className="bg-white rounded-3xl overflow-hidden"
         style={{ border: '2px solid #f3e8ff', boxShadow: '0 2px 8px #a855f715' }}>
      {/* Imagen */}
      <div className="h-40 bg-ink-100 relative overflow-hidden">
        <div className="absolute inset-0 skeleton-shimmer" />
      </div>
      {/* Contenido */}
      <div className="p-3 space-y-2">
        <div className="h-4 bg-ink-100 rounded-full w-4/5 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-3 bg-ink-100 rounded-full w-full relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-3 bg-ink-100 rounded-full w-2/3 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-4 bg-ink-100 rounded-full w-1/3 mt-1 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
        <div className="h-8 bg-ink-100 rounded-full w-full mt-2 relative overflow-hidden">
          <div className="absolute inset-0 skeleton-shimmer" />
        </div>
      </div>

      {/* Keyframe del shimmer — solo se inyecta una vez en el DOM */}
      <style>{`
        .skeleton-shimmer {
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(168,85,247,0.08) 40%,
            rgba(255,61,172,0.10) 50%,
            rgba(168,85,247,0.08) 60%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 1.6s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%   { background-position: 200% center; }
          100% { background-position: -200% center; }
        }
      `}</style>
    </div>
  );
}

export default function ProductosSkeleton({ cantidad = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 p-4 max-w-7xl mx-auto">
      {Array.from({ length: cantidad }).map((_, i) => (
        <TarjetaSkeleton key={i} />
      ))}
    </div>
  );
}
