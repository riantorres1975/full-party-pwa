import { useEffect, useState } from 'react';

const STORAGE_KEY = 'fp-theme-v2';

function getInitialTheme() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === 'dark') return true;
  if (saved === 'light') return false;
  return false; // Tema claro por defecto para nuevos visitantes
}

export function useTheme() {
  const [isDarkMode, setIsDarkMode] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDarkMode);
    document.documentElement.classList.toggle('light', !isDarkMode);
    document.body.classList.toggle('theme-dark', isDarkMode);
    localStorage.setItem(STORAGE_KEY, isDarkMode ? 'dark' : 'light');

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) themeMeta.setAttribute('content', isDarkMode ? '#0f1124' : '#fbf7f3');
  }, [isDarkMode]);

  return {
    isDarkMode,
    setIsDarkMode,
    toggleTheme: () => setIsDarkMode(prev => !prev),
  };
}
