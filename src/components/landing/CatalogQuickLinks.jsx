import { ArrowUpRight, CircleDot, Shapes, PanelsTopLeft, Zap, PartyPopper } from 'lucide-react';
import { Link } from 'react-router-dom';
import Reveal from './Reveal';

const QUICK_LINKS = [
  { title: 'Globos de látex', description: 'Colores y medidas', href: '/catalogo/globos/globos-latex', icon: CircleDot, accent: '#a71962', background: '#fce5f2' },
  { title: 'Globos de figuras', description: 'Formas y personajes', href: '/catalogo/globos/globos-figuras', icon: Shapes, accent: '#6929ab', background: '#efe5fc' },
  { title: 'Decoración', description: 'Cortinas y guirnaldas', href: '/catalogo/decoracion', icon: PanelsTopLeft, accent: '#3457a6', background: '#e7edff' },
  { title: 'Inflado y helio', description: 'Bombas y accesorios', href: '/catalogo/inflado-y-helio', icon: Zap, accent: '#0b6965', background: '#dcf5ef' },
  { title: 'Efectos de fiesta', description: 'Confeti y espuma', href: '/catalogo/efectos-de-fiesta', icon: PartyPopper, accent: '#9b471d', background: '#fcead9' },
];

export default function CatalogQuickLinks() {
  return (
    <section className="lp-catalog-entry px-5" aria-labelledby="catalog-entry-title">
      <div className="max-w-[1152px] mx-auto">
        <div className="lp-catalog-entry__heading">
          <h2 id="catalog-entry-title" className="font-display">Compra por categoría</h2>
          <Link to="/catalogo" className="lp-catalog-entry__all">Ver todo el catálogo</Link>
        </div>

        <ul className="lp-catalog-entry__grid">
          {QUICK_LINKS.map(({ title, description, href, icon: Icon, accent, background }, index) => (
            <li key={href}>
              <Reveal delay={index * 0.045} className="lp-catalog-entry__reveal">
                <Link
                  to={href}
                  className="lp-catalog-entry__card"
                  style={{ '--quick-accent': accent, '--quick-background': background }}
                >
                  <span className="lp-catalog-entry__top">
                    <Icon className="lp-catalog-entry__icon" size={22} aria-hidden="true" />
                    <ArrowUpRight className="lp-catalog-entry__arrow" size={17} aria-hidden="true" />
                  </span>
                  <span>
                    <strong>{title}</strong>
                    <small>{description}</small>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
