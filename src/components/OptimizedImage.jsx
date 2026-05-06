import { useState, useRef, useEffect, memo } from 'react';
import { getSupabaseImageUrl } from '../utils/imagenes';

function buildInlineFallback(label = 'Producto') {
  const safeLabel = String(label || 'Producto').trim().slice(0, 40) || 'Producto';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="400" viewBox="0 0 400 400" role="img" aria-label="${safeLabel}"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop offset="0%" stop-color="#f3e8ff"/><stop offset="100%" stop-color="#e9d5ff"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/><circle cx="200" cy="150" r="48" fill="#c084fc" fill-opacity="0.35"/><rect x="120" y="220" width="160" height="16" rx="8" fill="#a855f7" fill-opacity="0.28"/><rect x="150" y="248" width="100" height="14" rx="7" fill="#a855f7" fill-opacity="0.22"/><text x="200" y="305" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="18" font-weight="700" fill="#7e22ce">${safeLabel}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

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
  imgWidth = 400,
  quality = 80,
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const imgRef = useRef(null);

  const fallbackSrc = buildInlineFallback(fallbackText || alt || 'Producto');
  const srcLimpio = typeof src === 'string' ? src.trim() : '';
  const srcTransformado = srcLimpio ? getSupabaseImageUrl(srcLimpio, { width: imgWidth, quality }) : srcLimpio;
  const srcFinal = error || !srcLimpio ? fallbackSrc : srcTransformado;

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
  }, [srcFinal, srcLimpio, fallbackSrc]);

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
        width={400}
        height={400}
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
