import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Navigation, Truck, MessageCircle, ShoppingBag } from 'lucide-react';
import SiteLayout from '../components/SiteLayout';
import { SUCURSALES } from '../data/sucursales';

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
  bgBranches: '#F0FFFE',
  bgBenefits: '#FEF3FF',
  borderSoft: '#EDE0F8',
};

const WA_HREF = 'https://wa.me/5214521040377?text=' + encodeURIComponent('Hola, quisiera más información de sus sucursales 🎉');

export default function Sucursales() {
  return (
    <SiteLayout>
      <div className="max-w-5xl mx-auto px-5 py-12">

        <header className="text-center mb-12">
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
            Encuéntranos en Uruapan
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: C.textMuted }}>
            Dos sucursales para atenderte en Uruapan, Michoacán. Artículos para fiesta al mayoreo y menudeo,
            con atención personalizada para decoradores, revendedores y organizadores de eventos.
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-14">
          {SUCURSALES.map(({ id, nombre, badge, direccion, cp, telefono, telefonoHref, horario, horarioExtra, mapsUrl, embedUrl, color, accent }) => (
            <article
              key={id}
              id={id}
              className="rounded-2xl overflow-hidden bg-white shadow-sm"
              style={{
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${color}, ${accent}) border-box`,
              }}
            >
              <div className="relative h-48" style={{ borderBottom: `1px solid ${color}33` }}>
                <iframe
                  src={embedUrl}
                  className="w-full h-full"
                  style={{ border: 0 }}
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  allowFullScreen
                  title={`Mapa ${nombre}`}
                />
                <span
                  className="absolute top-3 left-3 text-xs font-black px-3 py-1 rounded-full"
                  style={{
                    background: 'rgba(255,255,255,0.92)',
                    color,
                    border: `1px solid ${color}44`,
                    backdropFilter: 'blur(6px)',
                  }}
                >
                  {badge}
                </span>
              </div>

              <div className="p-5 sm:p-6 flex flex-col gap-4">
                <h2 className="font-display text-xl" style={{ color: C.textHead }}>
                  {nombre}
                </h2>

                <div className="flex flex-col gap-3 text-sm" style={{ color: C.textBody }}>
                  <p className="flex items-start gap-2">
                    <MapPin size={14} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
                    <span>
                      {direccion}
                      <br />
                      <span className="text-xs" style={{ color: C.textMuted }}>C.P. {cp}</span>
                    </span>
                  </p>
                  <p className="flex items-start gap-2">
                    <Phone size={14} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
                    <a href={telefonoHref} className="font-bold hover:underline" style={{ color: C.textBody }}>
                      {telefono}
                    </a>
                  </p>
                  <p className="flex items-start gap-2">
                    <Clock size={14} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
                    <span>
                      {horario}
                      <br />
                      <span className="text-xs" style={{ color: C.textMuted }}>{horarioExtra}</span>
                    </span>
                  </p>
                </div>

                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-black transition-transform hover:scale-[1.02]"
                  style={{ background: `${color}14`, color, border: `1px solid ${color}33` }}
                >
                  <Navigation size={14} aria-hidden="true" /> Ver en Google Maps
                </a>
              </div>
            </article>
          ))}
        </section>

        <section
          className="rounded-2xl p-6 sm:p-10 mb-14"
          style={{ background: C.bgBranches, border: `1px solid ${C.borderSoft}` }}
        >
          <div className="flex items-start gap-4">
            <div
              className="flex-shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${C.cyan}, ${C.blue})` }}
            >
              <Truck size={22} className="text-white" aria-hidden="true" />
            </div>
            <div className="flex-1">
              <h2 className="font-display text-2xl mb-2" style={{ color: C.textHead }}>
                Envíos a todo México
              </h2>
              <p className="text-sm leading-relaxed mb-3" style={{ color: C.textBody }}>
                Realizamos envíos locales en Uruapan y nacionales a cualquier parte de la República Mexicana.
                Trabajamos con paqueterías reconocidas para que tu pedido llegue en tiempo y forma, empacado con
                cuidado para que los globos y decoraciones lleguen en perfecto estado.
              </p>
              <p className="text-sm leading-relaxed" style={{ color: C.textBody }}>
                ¿Prefieres recoger tu pedido? Puedes pasar por cualquiera de nuestras dos sucursales en Uruapan
                una vez confirmado el pedido por WhatsApp.
              </p>
            </div>
          </div>
        </section>

        <section
          className="rounded-3xl px-6 py-10 sm:px-10 sm:py-14 text-center"
          style={{
            backgroundImage: `linear-gradient(${C.bgBenefits}, ${C.bgBenefits}), linear-gradient(135deg, ${C.pink}, ${C.purple}, ${C.cyan})`,
            backgroundOrigin: 'border-box',
            backgroundClip: 'padding-box, border-box',
            border: '2px solid transparent',
          }}
        >
          <h2 className="font-display text-2xl sm:text-3xl mb-3" style={{ color: C.textHead }}>
            ¿Listo para hacer tu pedido?
          </h2>
          <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: C.textBody }}>
            Explora nuestro catálogo digital o contáctanos por WhatsApp para atención personalizada.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalogo"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, boxShadow: `0 8px 24px ${C.pink}44` }}
            >
              <ShoppingBag size={16} aria-hidden="true" /> Ver Catálogo
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
            >
              <MessageCircle size={16} aria-hidden="true" /> Escribir por WhatsApp
            </a>
          </div>
        </section>
      </div>
    </SiteLayout>
  );
}
