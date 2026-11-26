import { Clock, MapPin, Navigation, Phone, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import SiteLayout, { SiteCallout, SitePageHero, SiteWhatsAppLink } from '../components/SiteLayout';
import { LATEX_CATALOG_PATH } from '../data/siteLinks';
import { SUCURSALES } from '../data/sucursales';

export default function Sucursales() {
  return (
    <SiteLayout>
      <SitePageHero
        title="Encuéntranos en Uruapan"
        description="Consulta la dirección, el teléfono y los horarios de nuestras dos sucursales."
      >
        {SUCURSALES.map(({ id, nombre }) => (
          <a key={id} href={'#' + id} className="site-button site-button--outline">
            <MapPin size={17} aria-hidden="true" /> {nombre}
          </a>
        ))}
      </SitePageHero>

      <div className="site-page-container site-page-content">
        <section className="grid gap-5 md:grid-cols-2" aria-label="Datos de las sucursales">
          {SUCURSALES.map(({ id, nombre, direccion, cp, telefono, telefonoHref, horario, horarioExtra, mapsUrl, embedUrl }) => (
            <article key={id} id={id} className="site-panel site-branch flex flex-col overflow-hidden">
              <div className="flex flex-1 flex-col gap-4 p-5 sm:p-6">
                <h2 className="font-display text-2xl">{nombre}</h2>

                <div className="grid gap-3 text-[#524160]">
                  <p className="flex items-start gap-2.5">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-[#782266]" aria-hidden="true" />
                    <span>{direccion}<br /><span className="text-sm">C.P. {cp}</span></span>
                  </p>
                  <p className="flex items-start gap-2.5">
                    <Clock size={18} className="mt-0.5 shrink-0 text-[#782266]" aria-hidden="true" />
                    <span>{horario}<br /><span className="text-sm">{horarioExtra}</span></span>
                  </p>
                </div>

                <div className="site-actions mt-auto">
                  <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="site-button site-button--primary">
                    <Navigation size={16} aria-hidden="true" /> Cómo llegar
                  </a>
                  <a href={telefonoHref} className="site-button site-button--outline">
                    <Phone size={16} aria-hidden="true" /> Llamar al {telefono}
                  </a>
                </div>
              </div>

              <iframe
                src={embedUrl}
                className="h-52 w-full border-0 border-t border-solid border-[#e9daee] bg-[#f5edf9]"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
                title={'Mapa de ' + nombre}
              />
            </article>
          ))}
        </section>

        <SiteCallout
          title="Haz tu pedido antes de salir"
          description="Revisa colores y medidas en el catálogo. Al hacer tu pedido, puedes elegir recoger en sucursal o solicitar envío."
        >
          <Link to={LATEX_CATALOG_PATH} className="site-button site-button--primary">
            <ShoppingBag size={17} aria-hidden="true" /> Ver globos de látex
          </Link>
          <SiteWhatsAppLink message="Hola, quisiera más información de sus sucursales">Preguntar por WhatsApp</SiteWhatsAppLink>
        </SiteCallout>
      </div>
    </SiteLayout>
  );
}
