import { Link } from 'react-router-dom';
import {
  ShoppingBag, Package, Sparkles, MessageCircle,
  Check, Clock, Truck, Star, ArrowRight,
} from 'lucide-react';

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
  bgSteps:    '#F5F3FF',
  bgBenefits: '#FEF3FF',
  borderSoft: '#EDE0F8',
};

const WA_HREF = 'https://wa.me/5214521040377?text=' + encodeURIComponent('Hola, tengo una duda sobre cómo hacer un pedido 🎉');

const PASOS = [
  {
    num: '1',
    icon: ShoppingBag,
    titulo: 'Navega el Catálogo',
    color: C.pink,
    desc: 'Explora +500 artículos para fiesta: globos de látex Glomex y Decoratex, globos foil, números, letras, cortinas de lluvia, guirnaldas, velas, sets y accesorios. Usa los filtros por categoría, marca y precio para encontrar rápido lo que buscas.',
    detalles: [
      'Filtros por categoría, marca, tamaño y precio',
      'Búsqueda por nombre o código de producto',
      'Ver todos los precios escalonados de mayoreo',
    ],
  },
  {
    num: '2',
    icon: Package,
    titulo: 'Agrega al Carrito',
    color: C.purple,
    desc: 'Selecciona la cantidad que necesitas y agrega productos al carrito. El precio se actualiza automáticamente según el tramo de mayoreo aplicable: entre más piezas acumules, mejor precio por unidad.',
    detalles: [
      'Precios mayoreo actualizados en tiempo real',
      'Carrito guardado automáticamente en tu dispositivo',
      'Modifica cantidades o elimina productos cuando quieras',
    ],
  },
  {
    num: '3',
    icon: Sparkles,
    titulo: 'Revisa tu Pedido',
    color: C.cyan,
    desc: 'Verifica cantidades, subtotales y el precio final aplicado. Elige si prefieres recoger en sucursal (Francisco Villa o Sol Naciente) o solicitar envío a tu ciudad. Agrega tus datos y comentarios adicionales.',
    detalles: [
      'Desglose claro de precios por producto',
      'Elige recolección en sucursal o envío',
      'Agrega notas y referencias para tu pedido',
    ],
  },
  {
    num: '4',
    icon: MessageCircle,
    titulo: 'Envía por WhatsApp',
    color: C.green,
    desc: 'Con un toque, tu pedido completo se envía a nuestro WhatsApp +52 452 104 0377 con todos los detalles. Nuestro equipo confirma disponibilidad, forma de pago y tiempo de entrega. Sin llamadas, sin formularios.',
    detalles: [
      'Pedido enviado en segundos, listo para confirmar',
      'Atención personalizada por WhatsApp',
      'Confirmación de disponibilidad y pago',
    ],
  },
];

const BENEFICIOS = [
  { icon: Clock, titulo: 'Pedido en 3 minutos', desc: 'Sin llamadas ni formularios largos.', color: C.pink },
  { icon: Star,  titulo: 'Precios escalonados', desc: 'Más piezas, mejor precio por unidad.', color: C.purple },
  { icon: Truck, titulo: 'Envíos a todo México', desc: 'Local en Uruapan y nacional.', color: C.cyan },
  { icon: Check, titulo: 'Distribuidor oficial', desc: 'Glomex, Decoratex, Sempertex y más.', color: C.green },
];

export default function ComoFunciona() {
  return (
    <div style={{ background: C.bgHero, color: C.textBody }} className="min-h-screen">
      <main className="max-w-5xl mx-auto px-5 py-12">

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
            ¿Cómo hacer un pedido?
          </h1>
          <p className="text-sm sm:text-base max-w-2xl mx-auto" style={{ color: C.textMuted }}>
            Pedir al mayoreo en Full Party Uruapan es rápido, claro y sin complicaciones.
            Sigue estos 4 pasos y recibe tu confirmación por WhatsApp en minutos.
          </p>
        </header>

        <section className="flex flex-col gap-6 mb-16">
          {PASOS.map(({ num, icon: Icon, titulo, color, desc, detalles }, i) => (
            <article
              key={num}
              className="rounded-2xl bg-white p-6 sm:p-8 shadow-sm flex flex-col sm:flex-row gap-5"
              style={{
                border: '2px solid transparent',
                backgroundImage: `linear-gradient(white, white) padding-box, linear-gradient(135deg, ${color}, ${C.purple}) border-box`,
              }}
            >
              <div className="flex-shrink-0 flex sm:flex-col items-center gap-3">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-white font-black text-xl"
                  style={{ background: `linear-gradient(135deg, ${color}, ${C.purple})` }}
                >
                  {num}
                </div>
                <Icon size={28} style={{ color }} aria-hidden="true" className="hidden sm:block" />
              </div>

              <div className="flex-1">
                <h2 className="font-display text-xl sm:text-2xl mb-2" style={{ color: C.textHead }}>
                  {titulo}
                </h2>
                <p className="text-sm leading-relaxed mb-4" style={{ color: C.textBody }}>
                  {desc}
                </p>
                <ul className="flex flex-col gap-2">
                  {detalles.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm" style={{ color: C.textBody }}>
                      <Check size={14} className="mt-0.5 flex-shrink-0" style={{ color }} aria-hidden="true" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          ))}
        </section>

        <section
          className="rounded-2xl px-6 py-10 sm:px-10 mb-14"
          style={{ background: C.bgSteps, border: `1px solid ${C.borderSoft}` }}
        >
          <h2 className="font-display text-2xl sm:text-3xl mb-8 text-center" style={{ color: C.textHead }}>
            ¿Por qué elegirnos?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {BENEFICIOS.map(({ icon: Icon, titulo, desc, color }) => (
              <div key={titulo} className="bg-white rounded-xl p-5 text-center shadow-sm">
                <div
                  className="w-11 h-11 mx-auto mb-3 rounded-xl flex items-center justify-center text-white"
                  style={{ background: `linear-gradient(135deg, ${color}, ${C.purple})` }}
                >
                  <Icon size={20} aria-hidden="true" />
                </div>
                <h3 className="font-display text-sm mb-1" style={{ color: C.textHead }}>{titulo}</h3>
                <p className="text-xs leading-relaxed" style={{ color: C.textMuted }}>{desc}</p>
              </div>
            ))}
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
            Comienza tu pedido ahora
          </h2>
          <p className="text-sm max-w-lg mx-auto mb-8" style={{ color: C.textBody }}>
            Explora +500 productos al mayoreo o contáctanos por WhatsApp si tienes dudas.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/catalogo"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: `linear-gradient(135deg, ${C.pink}, ${C.purple})`, boxShadow: `0 8px 24px ${C.pink}44` }}
            >
              <ShoppingBag size={16} aria-hidden="true" /> Explorar Catálogo
              <ArrowRight size={14} aria-hidden="true" />
            </Link>
            <a
              href={WA_HREF}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-black text-white transition-transform hover:scale-[1.03]"
              style={{ background: 'linear-gradient(135deg, #25d366, #128c7e)', boxShadow: '0 8px 24px rgba(37,211,102,0.35)' }}
            >
              <MessageCircle size={16} aria-hidden="true" /> Preguntar por WhatsApp
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
