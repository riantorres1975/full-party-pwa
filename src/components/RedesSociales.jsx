import { useState } from 'react';
import { Facebook, Instagram } from 'lucide-react';
import { useLanguage } from '../hooks/useLanguage';

function TikTokIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5
               2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01
               a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34
               6.34 6.34 0 0 0 6.33-6.34V8.95a8.2 8.2 0 0 0 4.79 1.52V7.03
               a4.85 4.85 0 0 1-1.02-.34z" />
    </svg>
  );
}

function WhatsAppIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15
               -.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463
               -2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606
               .134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025
               -.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008
               -.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479
               0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306
               1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719
               2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.118 1.528 5.855L.057 23.882
               a.75.75 0 0 0 .92.92l6.086-1.461A11.945 11.945 0 0 0 12 24c6.627 0
               12-5.373 12-12S18.627 0 12 0zm0 22c-1.907 0-3.7-.512-5.243-1.405l-.374
               -.22-3.865.928.951-3.791-.242-.389A9.96 9.96 0 0 1 2 12C2 6.477 6.477
               2 12 2s10 4.477 10 10-4.477 10-10 10z"/>
    </svg>
  );
}

const REDES_CONFIG = [
  {
    id:          'facebook',
    label:       'Facebook',
    href:        import.meta.env.VITE_URL_FACEBOOK,
    hoverBg:     '#e8f0fe',
    hoverColor:  '#1877f2',
    hoverShadow: '0 4px 16px #1877f233',
    Icon:        ({ size }) => <Facebook size={size} />,
  },
  {
    id:          'instagram',
    label:       'Instagram',
    href:        import.meta.env.VITE_URL_INSTAGRAM,
    hoverBg:     '#fce4ec',
    hoverColor:  '#e1306c',
    hoverShadow: '0 4px 16px #e1306c33',
    Icon:        ({ size }) => <Instagram size={size} />,
  },
  {
    id:          'tiktok',
    label:       'TikTok',
    href:        import.meta.env.VITE_URL_TIKTOK,
    hoverBg:     '#ebebeb',
    hoverColor:  '#010101',
    hoverShadow: '0 4px 16px #00000025',
    Icon:        ({ size }) => <TikTokIcon size={size} />,
  },
  {
    id:          'whatsapp',
    label:       'WhatsApp',
    href:        import.meta.env.VITE_URL_WHATSAPP_CHAT,
    hoverBg:     '#e8f5e9',
    hoverColor:  '#25d366',
    hoverShadow: '0 4px 16px #25d36633',
    Icon:        ({ size }) => <WhatsAppIcon size={size} />,
  },
];

// Solo muestra las redes que tienen URL configurada
const REDES = REDES_CONFIG.filter(r => r.href && r.href.trim() !== '');

function BtnRed({ red }) {
  const [hovered, setHovered] = useState(false);
  const { t } = useLanguage();
  return (
    <a
      href={red.href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t('social.visitUs', { name: red.label })}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={()    => setHovered(true)}
      onBlur={()     => setHovered(false)}
      className="flex items-center gap-2.5 px-5 py-2.5 rounded-full font-body
                 font-bold text-sm select-none no-underline outline-none
                 focus-visible:ring-2 focus-visible:ring-ink-300"
      style={{
        background:  hovered ? red.hoverBg    : 'var(--surface-elevated)',
        color:       hovered ? red.hoverColor : 'var(--text-inactive)',
        border:      `1.5px solid ${hovered ? red.hoverBg : 'var(--border-default)'}`,
        boxShadow:   hovered ? red.hoverShadow : 'none',
        transform:   hovered ? 'scale(1.07)'   : 'scale(1)',
        transition:  'all 0.28s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
    >
      <red.Icon size={18} />
      <span>{red.label}</span>
    </a>
  );
}

export default function RedesSociales() {
  const { t } = useLanguage();

  if (REDES.length === 0) return null;

  return (
    <div className="flex flex-col items-center gap-3 py-6 px-4">
      <p className="text-[11px] font-body font-black text-ink-300 tracking-[0.2em] uppercase">
        {t('common.followUs')}
      </p>
      <div className="flex items-center gap-3 flex-wrap justify-center">
        {REDES.map(red => <BtnRed key={red.id} red={red} />)}
      </div>
    </div>
  );
}
