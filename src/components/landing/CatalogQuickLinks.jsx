import { ArrowUpRight, PartyPopper, Palette, Sparkles, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';

const QUICK_LINKS = [
  {
    title: 'Globos por color',
    description: 'Encuentra el tono exacto',
    href: '/catalogo/globos/globos-latex',
    icon: Palette,
    accent: '#ff3dac',
    background: 'linear-gradient(145deg, #fff0f8, #fffafd)',
  },
  {
    title: 'Globos de látex',
    description: 'Gamas, colores y medidas',
    href: '/catalogo/globos/globos-latex',
    icon: Sparkles,
    accent: '#8b5cf6',
    background: 'linear-gradient(145deg, #f4efff, #fbfaff)',
  },
  {
    title: 'Inflado y helio',
    description: 'Bombas y accesorios',
    href: '/catalogo/inflado-y-helio',
    icon: Zap,
    accent: '#0891b2',
    background: 'linear-gradient(145deg, #eafcff, #f8feff)',
  },
  {
    title: 'Efectos de fiesta',
    description: 'Confeti, espuma y más',
    href: '/catalogo/efectos-de-fiesta',
    icon: PartyPopper,
    accent: '#e8791d',
    background: 'linear-gradient(145deg, #fff6e9, #fffdf9)',
  },
];

export default function CatalogQuickLinks() {
  return (
    <section className="lp-catalog-entry px-5" aria-labelledby="catalog-entry-title">
      <div className="lp-catalog-entry__inner max-w-[1100px] mx-auto">
        <div className="lp-catalog-entry__heading">
          <div>
            <span>Explora a tu manera</span>
            <h2 id="catalog-entry-title">Empieza por lo que necesitas</h2>
          </div>
          <Link to="/catalogo" className="lp-catalog-entry__all" aria-label="Ver catálogo completo">
            <span className="lp-catalog-entry__all-full">Ver catálogo completo</span>
            <span className="lp-catalog-entry__all-short">Ver todos</span>
            <ArrowUpRight size={15} aria-hidden="true" />
          </Link>
        </div>

        <div className="lp-catalog-entry__grid">
          {QUICK_LINKS.map(({ title, description, href, icon: Icon, accent, background }) => (
            <Link
              key={title}
              to={href}
              className="lp-catalog-entry__card"
              style={{ '--quick-accent': accent, '--quick-background': background }}
              aria-label={`${title}: ${description}`}
            >
              <span className="lp-catalog-entry__icon" aria-hidden="true">
                <Icon size={22} strokeWidth={2.2} />
              </span>
              <span className="lp-catalog-entry__copy">
                <strong>{title}</strong>
                <small>{description}</small>
              </span>
              <ArrowUpRight className="lp-catalog-entry__arrow" size={17} aria-hidden="true" />
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
