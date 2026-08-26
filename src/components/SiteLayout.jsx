import { WaIcon } from './icons/SocialIcons';
import PublicSiteHeader from './PublicSiteHeader';
import SiteFooter from './SiteFooter';

const WHATSAPP_NUMBER = import.meta.env.VITE_WHATSAPP_NUMBER || '5214521040377';
const WA_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent('Hola, me interesa hacer un pedido')}`;

export default function SiteLayout({ children }) {
  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#FEFAFF' }}>
      <PublicSiteHeader />

      {/* ══ CONTENIDO ════════════════════════════════════════ */}
      <main className="flex-1">
        {children}
      </main>

      <SiteFooter />

      {/* ══ FAB WhatsApp ═════════════════════════════════════ */}
      <aside aria-label="Contacto rápido">
        <a
          href={WA_HREF}
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 flex items-center justify-center rounded-full font-black text-sm text-white w-14 h-14 sm:w-auto sm:h-auto sm:gap-2.5 sm:pl-4 sm:pr-5 sm:py-3.5 transition-transform hover:scale-[1.07]"
          style={{ background: 'linear-gradient(135deg, #25d366, #1aab56)', boxShadow: '0 6px 20px rgba(37,211,102,0.5)' }}
          aria-label="Contactar por WhatsApp"
        >
          <WaIcon size={20} />
          <span className="hidden sm:inline">¿Dudas? ¡Escríbenos!</span>
        </a>
      </aside>
    </div>
  );
}
