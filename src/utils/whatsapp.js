import { NUMERO_WHATSAPP, NOMBRE_NEGOCIO, SIMBOLO_MONEDA } from '../data/productos';

/**
 * generarMensajeWhatsApp
 * @param {Array}  items    - Items del carrito
 * @param {number} total    - Total del pedido
 * @param {Object} entrega  - { tipo, nombre, telefono, direccion, folio? }
 */
export function generarMensajeWhatsApp(items, total, entrega) {
  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const sep = '-'.repeat(28);

  let mensaje = `\uD83C\uDF89 *Nuevo Pedido - ${NOMBRE_NEGOCIO}*\n`;
  mensaje += `\uD83D\uDCC5 ${fecha}\n`;

  // Folio — solo si Supabase lo generó correctamente
  if (entrega.folio) {
    mensaje += `\uD83D\uDCCB *Folio:* ${entrega.folio}\n`;
    mensaje += `\uD83D\uDD0E Rastrea tu pedido con este folio en nuestra tienda\n`;
  }

  mensaje += `${sep}\n\n`;

  // Datos del cliente
  mensaje += `\uD83D\uDC64 *Cliente:* ${entrega.nombre}\n`;
  mensaje += `\uD83D\uDCDE *Tel\u00E9fono:* ${entrega.telefono}\n`;

  if (entrega.tipo === 'envio') {
    mensaje += `\uD83D\uDE9A *Entrega:* Env\u00EDo a domicilio\n`;
    mensaje += `\uD83D\uDCCD *Direcci\u00F3n:* ${entrega.direccion}\n`;
  } else {
    mensaje += `\uD83C\uDFEA *Entrega:* Recoger en tienda\n`;
  }

  mensaje += `\n${sep}\n\n`;

  // Productos
  items.forEach((item, index) => {
    mensaje += `${index + 1}. *${item.nombre}*\n`;
    mensaje += `   Cantidad: ${item.cantidad}\n`;
    mensaje += `   Precio unitario: ${SIMBOLO_MONEDA}${item.precio.toFixed(2)}\n`;
    mensaje += `   Subtotal: ${SIMBOLO_MONEDA}${(item.precio * item.cantidad).toFixed(2)}\n\n`;
  });

  mensaje += `${sep}\n`;
  mensaje += `\uD83D\uDCB0 *TOTAL: ${SIMBOLO_MONEDA}${total.toFixed(2)}*\n\n`;
  mensaje += `Por favor, confirma mi pedido. Gracias! \uD83D\uDE0A`;

  return `https://wa.me/${NUMERO_WHATSAPP}?text=${encodeURIComponent(mensaje)}`;
}
