import { Store, Truck } from 'lucide-react';
import { useLanguage } from '../../../../hooks/useLanguage';

export default function EntregaPedido({ tipo, sucursal }) {
  const { t } = useLanguage();
  const envio = tipo === 'envio';
  const Icono = envio ? Truck : Store;
  const texto = sucursal
    ? t(envio ? 'admin.orders.delivery.shipFrom' : 'admin.orders.delivery.pickupAt', { branch: sucursal.nombre })
    : t(envio ? 'admin.orders.delivery.home' : 'admin.orders.delivery.pickup');

  return (
    <span className="flex items-start gap-1.5 text-admin-text-secondary">
      <Icono size={14} aria-hidden="true" className="mt-0.5 shrink-0" />
      <span>{texto}</span>
    </span>
  );
}
