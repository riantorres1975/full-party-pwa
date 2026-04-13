import { NUMERO_WHATSAPP, NOMBRE_NEGOCIO, SIMBOLO_MONEDA } from '../data/productos';

/**
 * generarMensajeWhatsApp
 * @param {Array}  items    - Items del carrito
 * @param {number} total    - Total del pedido
 * @param {Object} entrega  - { tipo, nombre, telefono, direccion, folio? }
 */
export function generarMensajeWhatsApp(items, total, entrega) {
  if (!NUMERO_WHATSAPP || !/^\d{10,15}$/.test(NUMERO_WHATSAPP)) {
    throw new Error('NUMERO_WHATSAPP no está configurado o es inválido.');
  }

  // 1. Diccionario de emojis con Code Points para evitar errores en Desktop
  const EMOJI = {
    pedido: String.fromCodePoint(0x1F4CB),
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

  let mensaje = `${EMOJI.pedido} *Nuevo Pedido - ${NOMBRE_NEGOCIO}*\n`;
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

  // Productos (precio aplicado ya viene guardado en item.precio)
  items.forEach((item, index) => {
    const precioAplicado = Number(item.precio) || 0;
    const subtotal = precioAplicado * (Number(item.cantidad) || 0);

    mensaje += `${index + 1}. *${item.nombre}*\n`;
    mensaje += `   Cantidad: ${item.cantidad}\n`;
    mensaje += `   Precio aplicado: ${SIMBOLO_MONEDA}${precioAplicado.toFixed(2)}\n`;
    mensaje += `   Subtotal: ${SIMBOLO_MONEDA}${subtotal.toFixed(2)}\n\n`;
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

// ── Notificación WhatsApp al cliente (admin → cliente) ──────────────────────
export function notificarCliente(pedido, articulosSurtidos = null) {
  const { cliente_nombre: nombre, cliente_telefono: tel, folio, estado } = pedido;

  const EMOJI = {
    caja: String.fromCodePoint(0x1F4E6),
    check: String.fromCodePoint(0x2705),
    cruz: String.fromCodePoint(0x274C),
    alerta: String.fromCodePoint(0x26A0),
    dinero: String.fromCodePoint(0x1F4B0),
    ok: String.fromCodePoint(0x1F44D),
    reloj: String.fromCodePoint(0x23F0),
  };

  let mensaje = '';

  if (estado === 'Listo para Entrega' && articulosSurtidos) {
    const surtidos = articulosSurtidos.filter(a => (Number(a.cantidad_surtida) || 0) > 0);
    const sinStock = articulosSurtidos.filter(a => (Number(a.cantidad_surtida) || 0) === 0);
    const parciales = surtidos.filter(a => (Number(a.cantidad_surtida) || 0) < Number(a.cantidad));
    const nuevoTotal = surtidos.reduce((s, a) => s + (Number(a.precio) || 0) * (Number(a.cantidad_surtida) || 0), 0);

    const listaSurtidos = surtidos
      .map(a => {
        const cs = Number(a.cantidad_surtida) || 0;
        const cp = Number(a.cantidad) || 0;
        const sub = (Number(a.precio) || 0) * cs;
        const cantTexto = cs < cp ? `${cs}x (pediste ${cp})` : `${cs}x`;
        return `  ${EMOJI.check} ${cantTexto} ${a.nombre} - ${SIMBOLO_MONEDA}${sub.toFixed(2)}`;
      })
      .join('\n');

    let infoFaltantes = '';
    if (sinStock.length > 0) {
      infoFaltantes += `\n${EMOJI.alerta} *Lamentablemente no tuvimos en existencia:*\n` +
        sinStock.map(a => `  ${EMOJI.cruz} ${a.nombre}`).join('\n') + '\n';
    }
    if (parciales.length > 0) {
      infoFaltantes += `\n${EMOJI.alerta} *Cantidad ajustada por inventario:*\n` +
        parciales.map(a => `  ${EMOJI.cruz} ${a.nombre}: pediste ${a.cantidad}, surtimos ${a.cantidad_surtida}`).join('\n') + '\n';
    }

    mensaje =
      `¡Hola ${nombre}! Tu pedido *${folio}* ya está listo y empacado. ${EMOJI.caja}\n\n` +
      `*Artículos incluidos:*\n${listaSurtidos}\n` +
      infoFaltantes +
      `\n${EMOJI.dinero} *Tu total a pagar es: ${SIMBOLO_MONEDA}${nuevoTotal.toFixed(2)}*\n\n` +
      `¡Gracias por tu compra! ${EMOJI.ok}`;

  } else {
    switch (estado) {
      case 'Por Surtir':
        mensaje = `¡Hola ${nombre}! ${EMOJI.check} Recibimos tu pedido *${folio}* y ya está en nuestro sistema. En breve comenzamos a prepararlo. ¡Gracias por tu compra!`;
        break;
      case 'Armando Pedido':
        mensaje = `¡Hola ${nombre}! ${EMOJI.reloj} Tu pedido *${folio}* está siendo preparado. En cuanto esté listo te avisamos.`;
        break;
      case 'Listo para Entrega':
        mensaje = `¡Hola ${nombre}! ${EMOJI.caja} Tu pedido *${folio}* ya está listo. Puedes pasar a recogerlo o en breve saldrá a domicilio.`;
        break;
      case 'Cancelado':
        mensaje = `Hola ${nombre}, lamentamos informarte que tu pedido *${folio}* ha sido cancelado. ${EMOJI.cruz}\n\nSi tienes dudas, no dudes en escribirnos.`;
        break;
      default:
        mensaje = `Hola ${nombre}, hay una actualización en tu pedido *${folio}*. Estado actual: ${estado}.`;
    }
  }

  const telefonoLimpio = tel.replace(/[\s\-\(\)]/g, '');

  const phoneParam = (telefonoLimpio.startsWith('52') && telefonoLimpio.length >= 12)
    ? telefonoLimpio
    : `52${telefonoLimpio}`;

  const params = new URLSearchParams({
    phone: phoneParam,
    text: mensaje,
  });

  const url = `https://api.whatsapp.com/send?${params.toString()}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
