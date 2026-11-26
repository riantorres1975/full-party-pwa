import { ArrowRight, Check, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteLayout, { SiteCallout, SitePageHero, SiteWhatsAppLink } from '../components/SiteLayout';
import { LATEX_CATALOG_PATH } from '../data/siteLinks';

const PASOS = [
  {
    titulo: 'Encuentra el producto',
    desc: 'Busca por nombre o abre una categoría. Usa los filtros si ya sabes qué marca, color o medida necesitas.',
    detalles: ['Si el producto tiene variantes, abre Elegir opciones.', 'Revisa el contenido de cada presentación antes de elegir.'],
  },
  {
    titulo: 'Elige tus opciones y agrega',
    desc: 'Selecciona el color, la medida y la presentación que quieras. Indica cuántas unidades de esa presentación necesitas.',
    detalles: ['Revisa el precio y el mayoreo disponible.', 'Puedes agregar otra combinación del mismo producto.'],
  },
  {
    titulo: 'Revisa tu pedido',
    desc: 'Abre Mi pedido en el catálogo y revisa las cantidades. Agrega tus datos y elige si quieres recoger en sucursal o solicitar envío.',
    detalles: ['Puedes cambiar cantidades antes de continuar.', 'El costo de envío se confirma por WhatsApp.'],
  },
  {
    titulo: 'Guarda tu folio',
    desc: 'Al realizar el pedido, recibirás un folio y un enlace para consultar su estado.',
    detalles: ['Desde esa pantalla también puedes abrir WhatsApp para hablar con la tienda.'],
  },
];

export default function ComoFunciona() {
  return (
    <SiteLayout>
      <SitePageHero
        title="¿Cómo hacer un pedido?"
        description="Elige tus productos, decide cómo recibirlos y consulta el estado de tu pedido en línea."
      >
        <Link to="/catalogo" className="site-button site-button--primary">
          <ShoppingBag size={17} aria-hidden="true" /> Empezar en el catálogo
        </Link>
        <Link to={LATEX_CATALOG_PATH} className="site-button site-button--outline">Ver globos de látex</Link>
      </SitePageHero>

      <div className="site-page-container site-page-content">
        <section aria-labelledby="order-steps-title">
          <h2 id="order-steps-title" className="site-section-title font-display">Tu pedido en 4 pasos</h2>
          <ol className="grid gap-4 sm:grid-cols-2">
            {PASOS.map(({ titulo, desc, detalles }, index) => (
              <li key={titulo} className="site-panel p-5 sm:p-6">
                <h3 className="font-display flex items-center gap-3 text-xl">
                  <span className="site-icon-tile font-sans font-black" aria-hidden="true">{index + 1}</span>
                  {titulo}
                </h3>
                <p className="mt-3 leading-relaxed text-[#524160]">{desc}</p>
                <ul className="mt-3 grid gap-2 text-sm text-[#524160]">
                  {detalles.map((detalle) => (
                    <li key={detalle} className="flex items-start gap-2">
                      <Check size={16} className="mt-0.5 shrink-0 text-[#782266]" aria-hidden="true" /> {detalle}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
        </section>

        <SiteCallout title="¿Necesitas ayuda con tu pedido?" description="Si vas a recogerlo, puedes consultar las direcciones y horarios de las dos sucursales.">
          <Link to="/sucursales" className="site-button site-button--primary">
            Ver sucursales <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <SiteWhatsAppLink message="Hola, tengo una duda sobre cómo hacer un pedido">Preguntar por WhatsApp</SiteWhatsAppLink>
        </SiteCallout>
      </div>
    </SiteLayout>
  );
}
