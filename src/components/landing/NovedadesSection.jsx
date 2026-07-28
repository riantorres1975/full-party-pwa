import { Link } from 'react-router-dom';
import { ArrowRight, PackageCheck, Sparkles } from 'lucide-react';
import { useCatalogCards } from '../../hooks/catalog/useCatalogCards';
import { C } from '../../styles/tokens';
import Reveal from './Reveal';
import NovedadesCarrusel from './NovedadesCarrusel';

function NovedadesLoadingState() {
  return (
    <section className="lp-below-fold lp-section-white lp-novedades-section px-5 pt-8 pb-16" aria-hidden="true">
      <div className="max-w-[1100px] mx-auto">
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
              <span className="lp-novedades-count inline-flex items-center gap-1.5 text-xs font-black opacity-0">
                <PackageCheck size={13} aria-hidden="true" />
                12 productos nuevos
              </span>
            </div>
            <p className="lp-novedades-copy mt-2 text-sm sm:text-base leading-relaxed opacity-0" style={{ color: C.textBody }}>
              Lo mas reciente para surtir tu fiesta o negocio, listo para agregar al catalogo.
            </p>
          </div>
          <span className="lp-novedades-link text-xs font-black inline-flex items-center gap-1.5 opacity-0">
            Ver todo el catalogo <ArrowRight size={12} aria-hidden="true" />
          </span>
        </div>
        <div className="lp-novedades-shell">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {[0, 1, 2, 3].map((item) => (
              <div key={item} className={`lp-novedad-skeleton ${item > 1 ? 'hidden sm:block' : ''}`} />
            ))}
          </div>
          <div className="lp-novedades-controls opacity-0">
            <span className="lp-novedades-arrow" />
            <span className="lp-novedades-dots">
              {[0, 1, 2, 3, 4].map((item) => (
                <span
                  key={item}
                  className="lp-novedades-dot"
                  style={{ width: item === 3 ? 22 : 7, background: `${C.pink}40` }}
                />
              ))}
            </span>
            <span className="lp-novedades-arrow" />
          </div>
        </div>
      </div>
    </section>
  );
}

export default function NovedadesSection() {
  const { cards, loading } = useCatalogCards({ sort: 'featured' });
  const novedades = cards.filter((card) => card.isNew).slice(0, 12);

  if (loading && cards.length === 0) return <NovedadesLoadingState />;
  if (novedades.length === 0) return null;

  return (
    <section className="lp-below-fold lp-section-white lp-novedades-section px-5 pt-8 pb-16">
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
