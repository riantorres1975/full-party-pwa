import { useState, useRef, useEffect, memo } from 'react';

/**
 * OptimizedImage — imagen con:
 * - Placeholder de color sólido con shimmer mientras carga
 * - Transición suave de opacidad al cargar
 * - `loading="lazy"` + `decoding="async"` para no bloquear el hilo principal
 * - `fetchpriority` para imágenes above-the-fold
 * - Fallback automático a placehold.co si la imagen falla
 */
function OptimizedImageInner({
  src,
  alt,
  className = '',
  style = {},
  priority = false,
  fallbackText = '',
  aspectClass = 'aspect-square',
  containerClass = '',
  containerStyle = {},
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  // Reset al cambiar de src, luego verificar si ya está en cache del navegador
  useEffect(() => {
    setLoaded(false);
    setError(false);

    // Micro-task delay para que el navegador actualice el elemento <img>
    // antes de verificar .complete (cached images)
    const raf = requestAnimationFrame(() => {
      if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
        setLoaded(true);
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [src]);

  const fallbackSrc = `https://placehold.co/400x400/e2e8f0/64748b?text=${encodeURIComponent(fallbackText || alt || '?')}`;

  return (
    <div
      className={`relative overflow-hidden ${aspectClass} ${containerClass}`}
      style={{ background: 'var(--surface-card)', ...containerStyle }}
    >
      {/* Shimmer placeholder — visible until image loads */}
      {!loaded && (
        <div className="absolute inset-0 z-[1]" style={{ background: 'var(--surface-card)' }}>
          <div
            className="absolute inset-0"
            style={{
              background: 'linear-gradient(90deg, transparent 0%, var(--border-soft) 50%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s ease-in-out infinite',
            }}
          />
        </div>
      )}

      <img
        ref={imgRef}
        src={error ? fallbackSrc : src}
        alt={alt}
        width={400}
        height={400}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={priority ? 'high' : 'auto'}
        className={`w-full h-full object-contain transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={style}
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (!error) {
            setError(true);
            setLoaded(false); // will trigger load with fallback
          } else {
            setLoaded(true); // fallback also failed, just show it
          }
        }}
      />
    </div>
  );
}

export const OptimizedImage = memo(OptimizedImageInner);
export default OptimizedImage;
