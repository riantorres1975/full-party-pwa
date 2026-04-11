import { useLanguage } from '../hooks/useLanguage';

export default function LanguageToggle() {
  const { lang, setLang, t } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === 'es' ? 'en' : 'es')}
      className="w-10 h-10 sm:w-auto sm:h-auto flex items-center justify-center text-[11px] font-body font-black
                 px-2 sm:px-2.5 py-1.5 rounded-full border transition-all duration-200
                 hover:opacity-80 active:scale-95"
      style={{
        borderColor: 'var(--border-soft)',
        background: 'var(--surface-card)',
        color: 'var(--text-secondary)',
      }}
      aria-label={t('lang.label')}
      title={t('lang.label')}
    >
      {t('lang.toggle')}
    </button>
  );
}
