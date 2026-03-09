import { NUMERO_WHATSAPP, NOMBRE_NEGOCIO, SIMBOLO_MONEDA } from '../data/productos';

/**
 * generarMensajeWhatsApp
 * @param {Array}  items    - Items del carrito
 * @param {number} total    - Total del pedido
 * @param {Object} entrega  - { tipo, nombre, telefono, direccion, folio? }
 */
export function generarMensajeWhatsApp(items, total, entrega) {
  // 1. Diccionario de emojis con Code Points para evitar errores en Desktop
  const EMOJI = {
    fiesta: String.fromCodePoint(0x1F389),
    calendario: String.fromCodePoint(0x1F4C5),
    folio: String.fromCodePoint(0x1F4CB),
    lupa: String.fromCodePoint(0x1F50E),
    cliente: String.fromCodePoint(0x1F464),
    telefono: String.fromCodePoint(0x1F4DE),
    envio: String.fromCodePoint(0x1F69A),
    direccion: String.fromCodePoint(0x1F4CD),
    tienda: String.fromCodePoint(0x1F3EA),
    dinero: String.fromCodePoint(0x1F4B0),
    sonrisa: String.fromCodePoint(0x1F60A)
  };

  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  const sep = '-'.repeat(28);

  let mensaje = `${EMOJI.fiesta} *Nuevo Pedido - ${NOMBRE_NEGOCIO}*\n`;
  mensaje += `${EMOJI.calendario} ${fecha}\n`;

  // Folio — solo si Supabase lo generó correctamente
  if (entrega.folio) {
    mensaje += `${EMOJI.folio} *Folio:* ${entrega.folio}\n`;
    mensaje += `${EMOJI.lupa} Rastrea tu pedido con este folio en nuestra tienda\n`;
  }

  mensaje += `${sep}\n\n`;

  // Datos del cliente
  mensaje += `${EMOJI.cliente} *Cliente:* ${entrega.nombre}\n`;
  // Cambié \u00E9 por 'é' normal, URLSearchParams lo codifica sin problema
  mensaje += `${EMOJI.telefono} *Teléfono:* ${entrega.telefono}\n`;

  if (entrega.tipo === 'envio') {
    mensaje += `${EMOJI.envio} *Entrega:* Envío a domicilio\n`;
    mensaje += `${EMOJI.direccion} *Dirección:* ${entrega.direccion}\n`;
  } else {
    mensaje += `${EMOJI.tienda} *Entrega:* Recoger en tienda\n`;
  }

  mensaje += `\n${sep}\n\n`;

  // Productos (Formato original conservado)
  items.forEach((item, index) => {
    mensaje += `${index + 1}. *${item.nombre}*\n`;
    mensaje += `   Cantidad: ${item.cantidad}\n`;
    mensaje += `   Precio unitario: ${SIMBOLO_MONEDA}${item.precio.toFixed(2)}\n`;
    mensaje += `   Subtotal: ${SIMBOLO_MONEDA}${(item.precio * item.cantidad).toFixed(2)}\n\n`;
  });

  mensaje += `${sep}\n`;
  mensaje += `${EMOJI.dinero} *TOTAL: ${SIMBOLO_MONEDA}${total.toFixed(2)}*\n\n`;
  mensaje += `Por favor, confirma mi pedido. Gracias! ${EMOJI.sonrisa}`;

  // 2. URL robusta para que la computadora no rompa los caracteres especiales
  const params = new URLSearchParams({
    phone: NUMERO_WHATSAPP,
    text: mensaje
  });

  return `https://api.whatsapp.com/send?${params.toString()}`;
}