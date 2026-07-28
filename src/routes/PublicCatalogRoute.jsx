import { useEffect } from 'react';
import '../catalog-v2.css';
import CatalogV2Page from '../pages/catalog-v2/CatalogV2Page.jsx';
import { ToastProvider } from '../components/ui/ToastProvider';

export default function PublicCatalogRoute() {
  useEffect(() => {
    document.body.classList.add('catalogo');
    document.body.classList.remove('landing-page');

    requestAnimationFrame(() => {
      window.__fpMarkAppReady?.();
    });

    return () => {
      document.body.classList.remove('catalogo');
    };
  }, []);

  return (
    <ToastProvider>
      <CatalogV2Page />
    </ToastProvider>
  );
}
