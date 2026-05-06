import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PackageCheck, Sparkles } from 'lucide-react';
import { useProductos } from '../../hooks/useProductos';
import { C } from '../../styles/tokens';
import Reveal from './Reveal';
import NovedadesCarrusel from './NovedadesCarrusel';

export default function NovedadesSection() {
  const { productos } = useProductos();
  const novedades = useMemo(
    () => productos.filter(p => p.es_nuevo === true && p.activo !== false).slice(0, 12),
    [productos],
  );

  if (novedades.length === 0) return null;

  return (
    <section className="lp-below-fold lp-novedades-section px-5 pt-8 pb-16" style={{ background: C.bgHero }}>
      <div className="max-w-[1100px] mx-auto">
        <Reveal>
          <div className="lp-novedades-heading mb-7">
            <div className="min-w-0">
              <span
                className="lp-novedades-eyebrow inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full mb-3"
                style={{ background: `linear-gradient(135deg, ${C.pink}30, ${C.purple}25)`, color: C.pink, border: `1px solid ${C.pink}33` }}
              >
                <Sparkles size={11} aria-hidden="true" /> Recien llegados
              </span>
              <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
                <h2 className="font-display text-3xl sm:text-4xl" style={{ color: C.textHead }}>
                  Novedades
                </h2>
                <span className="lp-novedades-count inline-flex items-center gap-1.5 text-xs font-black">
                  <PackageCheck size={13} aria-hidden="true" />
                  {novedades.length} productos nuevos
                </span>
              </div>
              <p className="lp-novedades-copy mt-2 text-sm sm:text-base leading-relaxed" style={{ color: C.textBody }}>
                Lo mas reciente para surtir tu fiesta o negocio, listo para agregar al catalogo.
              </p>
            </div>
            <Link
              to="/catalogo"
              className="lp-novedades-link text-xs font-black inline-flex items-center gap-1.5 transition-all"
            >
              Ver todo el catalogo <ArrowRight size={12} aria-hidden="true" />
            </Link>
          </div>
        </Reveal>
        <Reveal delay={0.1}>
          <NovedadesCarrusel novedades={novedades} />
        </Reveal>
      </div>
    </section>
  );
}
