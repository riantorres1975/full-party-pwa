import { useState } from 'react';
import { Facebook } from 'lucide-react';
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

const REDES = [
  {
    id:          'facebook',
    label:       'Facebook',
    href:        'https://www.facebook.com/profile.php?id=100068298698109',
    hoverBg:     '#e8f0fe',
    hoverColor:  '#1877f2',
    hoverShadow: '0 4px 16px #1877f233',
    Icon:        ({ size }) => <Facebook size={size} />,
  },
  {
    id:          'tiktok',
    label:       'TikTok',
    href:        'https://www.tiktok.com/@fullpartyuruapan',
    hoverBg:     '#ebebeb',
    hoverColor:  '#010101',
    hoverShadow: '0 4px 16px #00000025',
    Icon:        ({ size }) => <TikTokIcon size={size} />,
  },
];

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
