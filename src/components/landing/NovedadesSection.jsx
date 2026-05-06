import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
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
    <section className="lp-below-fold px-5 pt-8 pb-14" style={{ background: C.bgHero }}>
      <div className="max-w-[1100px] mx-auto">
        <Reveal>
          <div className="flex items-center justify-between mb-7 flex-wrap gap-3">
            <div>
              <span
                className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-full mb-2"
                style={{ background: `linear-gradient(135deg, ${C.pink}30, ${C.purple}25)`, color: C.pink, border: `1px solid ${C.pink}33` }}
              >
                <Sparkles size={11} aria-hidden="true" /> Recién llegados
              </span>
              <h2 className="font-display text-2xl sm:text-3xl" style={{ color: C.textHead }}>
                Novedades
              </h2>
            </div>
            <Link
              to="/catalogo"
              className="text-xs font-black flex items-center gap-1 hover:gap-2 transition-all"
              style={{ color: C.pink }}
            >
              Ver todo el catálogo <ArrowRight size={12} aria-hidden="true" />
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
