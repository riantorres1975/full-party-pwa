import { useState, useRef, useEffect, memo } from 'react';
import { getSupabaseImageUrl, getInlineProductPlaceholder } from '../utils/imagenes';

/**
 * OptimizedImage — imagen con:
 * - Placeholder de color sólido con shimmer mientras carga
 * - Transición suave de opacidad al cargar
 * - `loading="lazy"` + `decoding="async"` para no bloquear el hilo principal
 * - `fetchpriority` para imágenes above-the-fold
 * - Fallback automático a un SVG inline (offline-safe) si la imagen falla
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
  imgWidth = 400,
  imgHeight = imgWidth,
  quality = 80,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  const srcLimpio = typeof src === 'string' ? src.trim() : '';
  const srcTransformado = srcLimpio ? getSupabaseImageUrl(srcLimpio, { width: imgWidth, quality }) : srcLimpio;
  const srcFinal = error || !srcLimpio
    ? getInlineProductPlaceholder(fallbackText || alt || 'Producto')
    : srcTransformado;

  useEffect(() => {
    setError(false);
  }, [src]);

  // Reset al cambiar src final (original/fallback), luego verificar cache del navegador
  useEffect(() => {
    setLoaded(false);

    if (!srcLimpio) {
      setLoaded(true);
      return undefined;
    }

    // Micro-task delay para que el navegador actualice el elemento <img>
    // antes de verificar .complete (cached images)
    const raf = requestAnimationFrame(() => {
      if (imgRef.current?.complete && imgRef.current?.naturalWidth > 0) {
        setLoaded(true);
      }
    });

    // Failsafe: si el <img> completó pero sin datos (naturalWidth=0), tratar como error.
    // Si sigue cargando tras 2200ms, simplemente quitar shimmer.
    const timeoutId = setTimeout(() => {
      const img = imgRef.current;
      if (img && img.complete && img.naturalWidth === 0 && !error) {
        setError(true);
      } else {
        setLoaded(true);
      }
    }, 2200);

    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timeoutId);
    };
  }, [srcFinal, srcLimpio, error]);

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
        src={srcFinal}
        alt={alt}
        width={imgWidth}
        height={imgHeight}
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
        fetchpriority={priority ? 'high' : 'auto'}
        className={`w-full h-full object-contain ${priority ? '' : 'transition-opacity duration-300'} ${loaded ? 'opacity-100' : 'opacity-0'} ${className}`}
        style={style}
        onLoad={(e) => {
          if (e.currentTarget.naturalWidth > 0) {
            setLoaded(true);
          } else if (!error) {
            setError(true);
          } else {
            setLoaded(true);
          }
        }}
        onError={() => {
          if (!error) {
            setError(true);
            setLoaded(false);
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
