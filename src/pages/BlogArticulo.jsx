import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Calendar, User, ArrowRight } from 'lucide-react';
import { ARTICULOS, getArticulo } from '../data/articulos';
import SiteLayout, { SiteCallout, SitePageHero, SiteWhatsAppLink } from '../components/SiteLayout';
import { LATEX_CATALOG_PATH } from '../data/siteLinks';

const SITE_URL = 'https://www.fullpartyuruapan.com.mx';

export default function BlogArticulo() {
  const { slug } = useParams();
  const articulo = getArticulo(slug);

  useEffect(() => {
    if (!articulo) return;

    const title = `${articulo.titulo} | Blog Full Party Uruapan`;
    const description = articulo.extracto;
    const canonical = `${SITE_URL}/blog/${articulo.slug}`;

    document.title = title;

    const mDesc = document.querySelector('meta[name="description"]');
    if (mDesc) mDesc.setAttribute('content', description);

    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute('content', title);

    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute('content', description);

    let canonicalEl = document.querySelector('link[rel="canonical"]');
    if (!canonicalEl) {
      canonicalEl = document.createElement('link');
      canonicalEl.rel = 'canonical';
      document.head.appendChild(canonicalEl);
    }
    canonicalEl.href = canonical;

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: articulo.titulo,
      description: articulo.extracto,
      author: { '@type': 'Organization', name: articulo.autor },
      publisher: {
        '@type': 'Organization',
        name: 'Full Party Uruapan',
        logo: { '@type': 'ImageObject', url: `${SITE_URL}/icons/icon-192.png` },
      },
      datePublished: articulo.fecha,
      dateModified: articulo.fecha,
      mainEntityOfPage: { '@type': 'WebPage', '@id': canonical },
    };

    let script = document.getElementById('article-jsonld');
    if (!script) {
      script = document.createElement('script');
      script.id = 'article-jsonld';
      script.type = 'application/ld+json';
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify(jsonLd);

    return () => {
      const s = document.getElementById('article-jsonld');
      if (s) s.remove();
    };
  }, [articulo]);

  if (!articulo) return <Navigate to="/blog" replace />;

  const otros = ARTICULOS.filter((item) => item.slug !== articulo.slug).slice(0, 3);

  return (
    <SiteLayout>
      <article>
        <SitePageHero
          title={articulo.titulo}
          description={articulo.extracto}
          back={{ to: '/blog', label: 'Volver al blog' }}
          meta={
            <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-[#524160]">
              <span className="font-extrabold text-[#782266]">{articulo.categoria}</span>
              <time dateTime={articulo.fecha} className="flex items-center gap-1.5">
                <Calendar size={15} aria-hidden="true" /> {articulo.fechaLegible}
              </time>
              <span className="flex items-center gap-1.5">
                <User size={15} aria-hidden="true" /> {articulo.autor}
              </span>
            </div>
          }
        />

        <div className="site-page-container site-page-content">
          <div className="site-article-copy site-panel grid gap-5">
            {articulo.parrafos.map((parrafo) => <p key={parrafo}>{parrafo}</p>)}
          </div>

          <SiteCallout
            title={articulo.latex ? 'Elige los globos para tu decoración' : 'Encuentra lo que necesitas para tu fiesta'}
            description={articulo.latex
              ? 'Explora los colores, las medidas y las presentaciones disponibles.'
              : 'Revisa los productos y combina tus favoritos para el evento.'}
          >
            <Link to={articulo.latex ? LATEX_CATALOG_PATH : '/catalogo'} className="site-button site-button--primary">
              {articulo.latex ? 'Ver globos de látex' : 'Ver catálogo'} <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <SiteWhatsAppLink message="Hola, tengo una duda sobre mi decoración">Pedir ayuda por WhatsApp</SiteWhatsAppLink>
          </SiteCallout>

          <section aria-labelledby="related-guides-title">
            <h2 className="site-section-title font-display" id="related-guides-title">Sigue leyendo</h2>
            <ul className="grid gap-3 sm:grid-cols-3">
              {otros.map(({ slug: relatedSlug, titulo }) => (
                <li key={relatedSlug}>
                  <Link to={'/blog/' + relatedSlug} className="site-panel site-panel-link flex h-full items-center justify-between gap-3 p-4 font-extrabold">
                    {titulo} <ArrowRight size={16} className="shrink-0 text-[#782266]" aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </article>
    </SiteLayout>
  );
}
