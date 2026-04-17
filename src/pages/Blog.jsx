import { Link } from 'react-router-dom';
import { Calendar, ArrowRight, MessageCircle } from 'lucide-react';
import { ARTICULOS } from '../data/articulos';
import SiteLayout from '../components/SiteLayout';

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
  borderSoft: '#EDE0F8',
};

const COLORS = {
  pink:   { base: C.pink,   accent: C.purple },
  purple: { base: C.purple, accent: C.cyan   },
  cyan:   { base: C.cyan,   accent: C.blue   },
  orange: { base: C.orange, accent: C.pink   },
  green:  { base: C.green,  accent: C.cyan   },
};

export default function Blog() {
  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-5 py-12">

        <header className="text-center mb-14">
          <Link
            to="/"
            className="inline-block text-xs font-bold mb-4 hover:underline"
            style={{ color: C.textMuted }}
          >
            ← Volver al inicio
          </Link>
          <h1
            className="font-display text-4xl sm:text-5xl mb-3"
            style={{ color: C.textHead }}
          >
            Blog Full Party
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: C.textMuted }}>
            Guías, tutoriales e ideas para decorar tus fiestas y eventos. Consejos prácticos
            de nuestro equipo de decoradores para que aproveches al máximo tus globos y accesorios.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {ARTICULOS.map(({ slug, titulo, extracto, fecha, fechaLegible, categoria, emoji, color }) => {
            const { base, accent } = COLORS[color] || COLORS.pink;
            return (
              <Link
                key={slug}
                to={`/blog/${slug}`}
                className="group rounded-2xl bg-white shadow-sm transition-transform hover:scale-[1.02] flex flex-col overflow-hidden"
                style={{
                  border: '2px solid transparent',
                  backgroundImage: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${base}, ${accent}) border-box`,
                }}
              >
                <div
                  className="h-36 flex items-center justify-center text-6xl"
                  style={{ background: `linear-gradient(135deg, ${base}22, ${accent}22)` }}
                  aria-hidden="true"
                >
                  {emoji}
                </div>
                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-3 mb-3 text-xs" style={{ color: C.textMuted }}>
                    <span
                      className="px-2 py-1 rounded-full font-black"
                      style={{ background: `${base}14`, color: base }}
                    >
                      {categoria}
                    </span>
                    <time
                      dateTime={fecha}
                      className="flex items-center gap-1"
                    >
                      <Calendar size={11} aria-hidden="true" />
                      {fechaLegible}
                    </time>
                  </div>
                  <h2 className="font-display text-lg mb-2" style={{ color: C.textHead }}>
                    {titulo}
                  </h2>
                  <p className="text-sm leading-relaxed flex-1" style={{ color: C.textBody }}>
                    {extracto}
                  </p>
                  <span
                    className="mt-4 inline-flex items-center gap-1 text-xs font-black group-hover:gap-2 transition-all"
                    style={{ color: base }}
                  >
                    Leer artículo <ArrowRight size={12} aria-hidden="true" />
                  </span>
                </div>
              </Link>
            );
          })}
        </section>

        <section
          className="mt-14 rounded-2xl p-8 text-center"
          style={{ background: 'white', border: `1px solid ${C.borderSoft}` }}
        >
          <MessageCircle size={28} className="mx-auto mb-3" style={{ color: C.pink }} aria-hidden="true" />
          <h2 className="font-display text-xl mb-2" style={{ color: C.textHead }}>
            ¿Tienes una duda específica?
          </h2>
          <p className="text-sm mb-5 max-w-lg mx-auto" style={{ color: C.textMuted }}>
            Si buscas asesoría personalizada para tu evento, escríbenos por WhatsApp.
            Nuestro equipo responde en minutos.
          </p>
          <a
            href="https://wa.me/5214521040377"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
            style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
          >
            <MessageCircle size={16} aria-hidden="true" /> Escribir por WhatsApp
          </a>
        </section>
      </div>
    </SiteLayout>
  );
}
