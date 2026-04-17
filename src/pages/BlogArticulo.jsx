import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router-dom';
import { Calendar, User, ArrowLeft, ArrowRight, ShoppingBag, MessageCircle } from 'lucide-react';
import { ARTICULOS, getArticulo } from '../data/articulos';

const C = {
  pink:    '#F472B6',
  purple:  '#C084FC',
  green:   '#34D399',
  orange:  '#FB923C',
  cyan:    '#22D3EE',
  blue:    '#818CF8',
  textHead:  '#2D0D5A',
  textBody:  '#5B3080',
  textMuted: '#7B4FA6',
  bgHero:     '#FEFAFF',
  bgBenefits: '#FEF3FF',
  borderSoft: '#EDE0F8',
};

const COLORS = {
  pink:   { base: C.pink,   accent: C.purple },
  purple: { base: C.purple, accent: C.cyan   },
  cyan:   { base: C.cyan,   accent: C.blue   },
  orange: { base: C.orange, accent: C.pink   },
  green:  { base: C.green,  accent: C.cyan   },
};

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

  const { base, accent } = COLORS[articulo.color] || COLORS.pink;

  const otros = ARTICULOS.filter((a) => a.slug !== articulo.slug).slice(0, 3);

  return (
    <div style={{ background: C.bgHero, color: C.textBody }} className="min-h-screen">
      <main className="max-w-3xl mx-auto px-5 py-12">

        <Link
          to="/blog"
          className="inline-flex items-center gap-1 text-xs font-bold mb-6 hover:underline"
          style={{ color: C.textMuted }}
        >
          <ArrowLeft size={12} aria-hidden="true" /> Volver al blog
        </Link>

        <article>
          <header className="mb-8">
            <div className="flex items-center gap-3 mb-4 text-xs" style={{ color: C.textMuted }}>
              <span
                className="px-3 py-1 rounded-full font-black"
                style={{ background: `${base}14`, color: base }}
              >
                {articulo.categoria}
              </span>
              <time dateTime={articulo.fecha} className="flex items-center gap-1">
                <Calendar size={11} aria-hidden="true" />
                {articulo.fechaLegible}
              </time>
              <span className="flex items-center gap-1">
                <User size={11} aria-hidden="true" />
                {articulo.autor}
              </span>
            </div>

            <h1
              className="font-display text-3xl sm:text-4xl mb-4 leading-tight"
              style={{ color: C.textHead }}
            >
              {articulo.titulo}
            </h1>

            <p className="text-base leading-relaxed" style={{ color: C.textBody }}>
              {articulo.extracto}
            </p>

            <div
              className="mt-8 h-48 rounded-2xl flex items-center justify-center text-7xl"
              style={{ background: `linear-gradient(135deg, ${base}22, ${accent}22)`, border: `1px solid ${base}33` }}
              aria-hidden="true"
            >
              {articulo.emoji}
            </div>
          </header>

          <div className="flex flex-col gap-5">
            {articulo.parrafos.map((p, i) => (
              <p
                key={i}
                className="text-base leading-relaxed"
                style={{ color: C.textBody }}
              >
                {p}
              </p>
            ))}
          </div>
        </article>

        <section
          className="mt-12 rounded-2xl px-6 py-8 sm:px-10 text-center"
          style={{
            backgroundImage: `linear-gradient(${C.bgBenefits}, ${C.bgBenefits}), linear-gradient(135deg, ${base}, ${accent})`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            border: '2px solid transparent',
          }}
        >
          <h2 className="font-display text-xl sm:text-2xl mb-3" style={{ color: C.textHead }}>
            Todo lo que necesitas, al mayoreo
          </h2>
          <p className="text-sm max-w-lg mx-auto mb-6" style={{ color: C.textBody }}>
            +500 productos para decoradores, revendedores y organizadores. Envíos a todo México.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalogo"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${base}, ${accent})`, boxShadow: `0 8px 24px ${base}44` }}
            >
              <ShoppingBag size={14} aria-hidden="true" /> Ver Catálogo
            </Link>
            <a
              href="https://wa.me/5214521040377"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
            >
              <MessageCircle size={14} aria-hidden="true" /> WhatsApp
            </a>
          </div>
        </section>

        {otros.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-xl mb-5" style={{ color: C.textHead }}>
              Más artículos del blog
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {otros.map((a) => {
                const c = COLORS[a.color] || COLORS.pink;
                return (
                  <Link
                    key={a.slug}
                    to={`/blog/${a.slug}`}
                    className="group rounded-xl bg-white p-5 shadow-sm transition-transform hover:scale-[1.02] flex flex-col"
                    style={{ border: `1px solid ${c.base}33` }}
                  >
                    <div className="text-3xl mb-3" aria-hidden="true">{a.emoji}</div>
                    <h3
                      className="font-display text-sm mb-2 leading-snug"
                      style={{ color: C.textHead }}
                    >
                      {a.titulo}
                    </h3>
                    <span
                      className="mt-auto inline-flex items-center gap-1 text-xs font-black group-hover:gap-2 transition-all"
                      style={{ color: c.base }}
                    >
                      Leer <ArrowRight size={10} aria-hidden="true" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
