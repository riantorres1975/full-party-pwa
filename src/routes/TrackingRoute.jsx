import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import '../catalog.css';
import RastreoPedido from '../components/RastreoPedido';

export default function TrackingRoute() {
  const navigate = useNavigate();
  const { folio = '' } = useParams();

  useEffect(() => {
    document.body.classList.add('catalogo');
    document.body.classList.remove('landing-page');
    requestAnimationFrame(() => window.__fpMarkAppReady?.());

    return () => document.body.classList.remove('catalogo');
  }, []);

  return (
    <RastreoPedido
      initialFolio={folio}
      onCerrar={() => navigate('/catalogo')}
    />
  );
}
