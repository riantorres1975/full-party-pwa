import { CircleDot, Grid2X2, Hash, PanelsTopLeft, PartyPopper, Shapes, Sparkles, Type, Zap } from 'lucide-react';
import { Link } from 'react-router-dom';
import LatexFeature from '../components/LatexFeature';
import SiteLayout, { SiteCallout, SitePageHero, SiteWhatsAppLink } from '../components/SiteLayout';

const CATEGORIAS = [
  { path: 'globos/globos-figuras', icon: Shapes, titulo: 'Globos de figuras', desc: 'Formas y personajes para fiestas temáticas.' },
  { path: 'globos/globos-foil', icon: Sparkles, titulo: 'Globos foil', desc: 'Globos metalizados para combinar con tus arreglos.' },
  { path: 'globos/globos-numero', icon: Hash, titulo: 'Globos de números', desc: 'Para cumpleaños, aniversarios y graduaciones.' },
  { path: 'globos/letras-foil', icon: Type, titulo: 'Globos de letras', desc: 'Forma nombres, iniciales y mensajes.' },
  { path: 'decoracion', icon: PanelsTopLeft, titulo: 'Decoración', desc: 'Complementos para fondos, mesas y espacios de fiesta.' },
  { path: 'inflado-y-helio', icon: Zap, titulo: 'Inflado y helio', desc: 'Bombas, infladoras y accesorios para globos.' },
  { path: 'bases-y-montaje', icon: CircleDot, titulo: 'Bases y montaje', desc: 'Materiales de apoyo para tus arreglos.' },
  { path: 'efectos-de-fiesta', icon: PartyPopper, titulo: 'Efectos de fiesta', desc: 'Confeti, espuma y otros efectos para celebrar.' },
];

export default function Destacados() {
  return (
    <SiteLayout>
      <SitePageHero
        title="Categorías destacadas"
        description="Elige una categoría para ir directo a los productos que necesitas para tu fiesta."
      >
        <Link to="/catalogo" className="site-button site-button--primary">
          <Grid2X2 size={17} aria-hidden="true" /> Ver todo el catálogo
        </Link>
      </SitePageHero>

      <div className="site-page-container site-page-content">
        <LatexFeature />

        <section aria-labelledby="featured-categories-title">
          <h2 id="featured-categories-title" className="site-section-title font-display">Más categorías para tu fiesta</h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {CATEGORIAS.map(({ path, icon: Icon, titulo, desc }) => (
              <li key={path}>
                <Link to={'/catalogo/' + path} className="site-panel site-panel-link flex h-full items-start gap-3 p-4">
                  <span className="site-icon-tile"><Icon size={21} aria-hidden="true" /></span>
                  <span>
                    <strong className="block text-base">{titulo}</strong>
                    <span className="block text-sm text-[#524160]">{desc}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <SiteCallout title="¿Buscas un artículo en particular?" description="Dinos qué producto, color o medida necesitas.">
          <SiteWhatsAppLink message="Hola, busco un producto específico">Preguntar por WhatsApp</SiteWhatsAppLink>
        </SiteCallout>
      </div>
    </SiteLayout>
  );
}
