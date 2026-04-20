import { useLanguage } from '../../../../hooks/useLanguage';
import { SIMBOLO_MONEDA } from '../../../../data/productos';
import { getProductPlaceholderUrl, getSafeProductImageUrl } from '../../../../utils/imagenes';

export default function ItemArticulo({ item, modoPicking, encontrado, onToggle, onCantidadChange, esDesktop }) {
  const { t } = useLanguage();
  const fallbackImage = getProductPlaceholderUrl(item.nombre, '80x80');
  const imageSrc = getSafeProductImageUrl(item.imagen_url, item.nombre, '80x80');
  const precioSurtido = Number(item.precio_surtido ?? item.precio) || 0;
  const precioAplicado = Number(item.precio) || 0;
  const precioBase = Number(item.precio_base ?? item.precio_original ?? item.precio) || 0;
  const cantidadPedida = Number(item.cantidad) || 1;
  const cantidadSurtida = Number(item.cantidad_surtida ?? item.cantidad) || 0;
  const marcado = cantidadSurtida > 0;
  const completo = cantidadSurtida === cantidadPedida;
  const parcial = cantidadSurtida > 0 && cantidadSurtida < cantidadPedida;
  const tachado = !modoPicking && cantidadSurtida === 0 && encontrado === false;
  const pendientePicking = modoPicking && !marcado;
  const surtidoPicking = modoPicking && marcado;
  const precioMostrar = modoPicking && marcado ? precioSurtido : precioAplicado;
  const hayDescuento = precioMostrar < precioBase;
  const cambioPrecioMayoreo = modoPicking && marcado && precioSurtido !== precioAplicado;
  const cantidadParaSubtotal = modoPicking
    ? (marcado ? cantidadSurtida : cantidadPedida)
    : (typeof item.cantidad_surtida === 'number' ? cantidadSurtida : cantidadPedida);
  const subtotal = (precioMostrar * cantidadParaSubtotal).toFixed(2);
  const ahorroTotal = ((precioBase - precioMostrar) * (modoPicking && marcado ? cantidadSurtida : cantidadPedida)).toFixed(2);

  return (
    <div className={`flex items-center gap-3 py-3 border-b border-admin-border-soft last:border-0 transition-opacity duration-150 ${
      tachado ? 'opacity-50' : ''
    }`}>
      <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-admin-elevated border border-admin-border-soft flex items-center justify-center">
        <img src={imageSrc} alt={item.nombre} onError={(e) => e.target.src = fallbackImage} className="w-full h-full object-contain" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-body font-bold text-admin-text truncate">{item.nombre}</p>
        {item.tamano && <p className="text-xs font-body text-admin-muted">{item.tamano}</p>}
      </div>
      <div className="text-sm font-body font-bold shrink-0 text-right">
        <p className={`${tachado ? 'line-through text-admin-inactive' : 'text-admin-text'}`}>
          {SIMBOLO_MONEDA}{subtotal}
        </p>
      </div>
    </div>
  );
}
