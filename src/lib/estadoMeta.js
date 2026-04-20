import { ShoppingBag, Clock, CheckCircle2, Truck, XCircle } from 'lucide-react';

export const ESTADOS_ACTIVOS = ['Por Surtir', 'Armando Pedido', 'Listo para Entrega'];
export const ESTADOS_HISTORIAL = ['Enviado', 'Cancelado'];
export const ESTADO_META = {
  'Por Surtir':         { color: '#ef4444', bg: '#fee2e2', colorClass: 'text-status-pending',  bgClass: 'bg-status-pending-light',  borderClass: 'border-status-pending',  accentClass: 'bg-status-pending',  icon: ShoppingBag, activeStyle: { background: '#ef4444', color: 'white', boxShadow: '0 2px 8px #ef444455' }, inactiveStyle: { background: '#fee2e2', color: '#ef4444' } },
  'Armando Pedido':     { color: '#eab308', bg: '#fef9c3', colorClass: 'text-status-progress', bgClass: 'bg-status-progress-light', borderClass: 'border-status-progress', accentClass: 'bg-status-progress', icon: Clock, activeStyle: { background: '#eab308', color: 'white', boxShadow: '0 2px 8px #eab30855' }, inactiveStyle: { background: '#fef9c3', color: '#eab308' } },
  'Listo para Entrega': { color: '#22c55e', bg: '#dcfce7', colorClass: 'text-status-done',     bgClass: 'bg-status-done-light',     borderClass: 'border-status-done',     accentClass: 'bg-status-done',     icon: CheckCircle2, activeStyle: { background: '#22c55e', color: 'white', boxShadow: '0 2px 8px #22c55e55' }, inactiveStyle: { background: '#dcfce7', color: '#22c55e' } },
  'Enviado':            { color: '#3b82f6', bg: '#dbeafe', colorClass: 'text-blue-500',         bgClass: 'bg-blue-100',              borderClass: 'border-blue-500',        accentClass: 'bg-blue-500',        icon: Truck, activeStyle: { background: '#3b82f6', color: 'white', boxShadow: '0 2px 8px #3b82f655' }, inactiveStyle: { background: '#dbeafe', color: '#3b82f6' } },
  'Cancelado':          { color: '#6b7280', bg: '#f3f4f6', colorClass: 'text-gray-500',        bgClass: 'bg-gray-100',              borderClass: 'border-gray-500',        accentClass: 'bg-gray-500',        icon: XCircle, activeStyle: { background: '#6b7280', color: 'white', boxShadow: '0 2px 8px #6b728055' }, inactiveStyle: { background: '#f3f4f6', color: '#6b7280' } },
};

export function estadoLabel(estado, t) {
  if (estado === 'Por Surtir') return t('tracking.status.pending');
  if (estado === 'Armando Pedido') return t('tracking.status.preparing');
  if (estado === 'Listo para Entrega') return t('tracking.status.ready');
  if (estado === 'Enviado') return t('admin.orders.sent');
  if (estado === 'Cancelado') return t('admin.orders.status.cancelled');
  return estado;
}

export function normalizarArticulos(lista, modoPicking) {
  return (lista || []).map(i => {
    const cantidadPedida = Number(i.cantidad) || 1;
    let cantidadSurtida;
    if (typeof i.cantidad_surtida === 'number') {
      cantidadSurtida = i.cantidad_surtida;
    } else if (typeof i.encontrado === 'boolean') {
      cantidadSurtida = i.encontrado ? cantidadPedida : 0;
    } else {
      cantidadSurtida = modoPicking ? 0 : cantidadPedida;
    }
    return {
      ...i,
      cantidad_surtida: cantidadSurtida,
      encontrado: cantidadSurtida > 0,
    };
  });
}
