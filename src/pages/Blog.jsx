import { ArrowRight, Calendar } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BalloonPhoto } from '../components/LatexFeature';
import SiteLayout, { SiteCallout, SitePageHero, SiteWhatsAppLink } from '../components/SiteLayout';
import { ARTICULOS, getArticulo } from '../data/articulos';
import { BALLOON_ARCH_GUIDE_SLUG, LATEX_CATALOG_PATH } from '../data/siteLinks';

const featuredGuide = getArticulo(BALLOON_ARCH_GUIDE_SLUG);
const moreGuides = ARTICULOS.filter(({ slug }) => slug !== BALLOON_ARCH_GUIDE_SLUG);

export default function Blog() {
  return (
    <SiteLayout>
      <SitePageHero
        title="Blog Full Party"
        description="Ideas para decorar con globos de látex, elegir colores y preparar tu próximo montaje."
      >
        <Link to={LATEX_CATALOG_PATH} className="site-button site-button--outline">Ver globos de látex</Link>
      </SitePageHero>

      <div className="site-page-container site-page-content">
        <article className="site-blog-feature site-panel">
          <BalloonPhoto />
          <div className="grid content-center gap-3 p-5 sm:p-8">
            <h2 className="font-display text-2xl sm:text-3xl">{featuredGuide.titulo}</h2>
            <p className="leading-relaxed text-[#524160]">
              Aprende a combinar medidas de globos de látex y a preparar la estructura del arco.
            </p>
            <Link to={'/blog/' + featuredGuide.slug} className="site-button site-button--primary w-fit">
              Leer la guía del arco <ArrowRight size={17} aria-hidden="true" />
            </Link>
          </div>
        </article>

        <section aria-labelledby="blog-guides-title">
          <h2 id="blog-guides-title" className="site-section-title font-display">Más ideas y guías</h2>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {moreGuides.map(({ slug, titulo, extracto, fecha, fechaLegible, categoria }) => (
              <li key={slug}>
                <Link to={'/blog/' + slug} className="site-panel site-panel-link flex h-full flex-col gap-3 p-5">
                  <span className="text-xs font-extrabold text-[#782266]">{categoria}</span>
                  <h3 className="font-display text-lg">{titulo}</h3>
                  <p className="flex-1 text-sm leading-relaxed text-[#524160]">{extracto}</p>
                  <time dateTime={fecha} className="flex items-center gap-1.5 text-xs text-[#524160]">
                    <Calendar size={14} aria-hidden="true" /> {fechaLegible}
                  </time>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <SiteCallout title="¿Tienes una duda sobre tu decoración?" description="Cuéntanos qué quieres armar y qué colores o tamaños estás buscando.">
          <SiteWhatsAppLink message="Hola, tengo una duda sobre mi decoración">Escribir por WhatsApp</SiteWhatsAppLink>
        </SiteCallout>
      </div>
    </SiteLayout>
  );
}
