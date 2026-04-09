export function Skeleton({ className = '', variant = 'rect' }) {
  const base = 'animate-shimmer bg-gradient-to-r from-admin-card via-admin-bg to-admin-card bg-[length:200%_100%] rounded-xl';
  const variants = {
    rect: 'h-4 w-full',
    circle: 'h-10 w-10 rounded-full',
    card: 'h-24 w-full',
  };
  return <div className={`${base} ${variants[variant] || variants.rect} ${className}`} />;
}

export function SkeletonPedido() {
  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl p-4 space-y-3">
      <div className="flex items-center justify-between">
        <Skeleton className="h-5 w-24" />
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-full rounded-xl" />
        <Skeleton className="h-9 w-full rounded-xl" />
      </div>
    </div>
  );
}

export function SkeletonProducto() {
  return (
    <div className="bg-admin-card border border-admin-border rounded-2xl p-4 space-y-3">
      <Skeleton className="h-32 w-full rounded-xl" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex justify-between pt-2">
        <Skeleton className="h-5 w-16" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}
