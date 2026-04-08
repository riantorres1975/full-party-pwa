import { Moon, Sun } from 'lucide-react';

const VARIANT_STYLES = {
  catalog: 'text-purple-600 bg-transparent hover:bg-purple-100/50 focus:ring-purple-200',
  catalogDark: 'text-purple-200 bg-transparent hover:bg-white/10 focus:ring-purple-300/40',
  admin: 'text-white bg-transparent hover:bg-purple-700/60 focus:ring-purple-300/40',
};

export default function ThemeToggle({ isDarkMode, onToggle, variant = 'catalog' }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`p-2.5 rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 ${VARIANT_STYLES[variant] ?? VARIANT_STYLES.catalog}`}
      aria-label={isDarkMode ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDarkMode ? 'Tema claro' : 'Tema oscuro'}
    >
      {isDarkMode ? <Sun className="w-5 h-5" strokeWidth={2} /> : <Moon className="w-5 h-5" strokeWidth={2} />}
    </button>
  );
}
