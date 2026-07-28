import { NUMERO_WHATSAPP, NOMBRE_NEGOCIO, SIMBOLO_MONEDA } from '../data/productos';
import { construirUrlRastreo } from './rastreo';

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
    mensaje += `${EMOJI.lupa} *Consulta el estado de tu pedido:*\n`;
    mensaje += `${construirUrlRastreo(entrega.folio)}\n`;
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

export function generarMensajeWhatsAppCatalogoV2(items, total, entrega) {
  if (!NUMERO_WHATSAPP || !/^\d{10,15}$/.test(NUMERO_WHATSAPP)) {
    throw new Error('NUMERO_WHATSAPP no está configurado o es inválido.');
  }

  const lines = Array.isArray(items) ? items : [];
  const money = (value) => `${SIMBOLO_MONEDA}${(Number(value) || 0).toFixed(2)}`;
  const fecha = new Date().toLocaleDateString('es-MX', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const delivery = entrega.tipo === 'envio'
    ? `Envío a domicilio\nDirección: ${entrega.direccion}`
    : 'Recoger en tienda';

  let mensaje = `*Nuevo pedido - ${NOMBRE_NEGOCIO}*\n`;
  mensaje += `Fecha: ${fecha}\n`;
  mensaje += `Folio: *${entrega.folio}*\n`;
  mensaje += `Rastreo: ${construirUrlRastreo(entrega.folio)}\n\n`;
  mensaje += `*Cliente:* ${entrega.nombre}\n`;
  mensaje += `*Teléfono:* ${entrega.telefono}\n`;
  mensaje += `*Entrega:* ${delivery}\n\n`;
  mensaje += '*Productos*\n\n';

  lines.forEach((item, index) => {
    mensaje += `${index + 1}. *${item.nombre || 'Producto'}*\n`;
    if (item.marca) mensaje += `   Marca: ${item.marca}\n`;
    if (item.gama) mensaje += `   Gama: ${item.gama}\n`;
    if (item.color) mensaje += `   Color: ${item.color}\n`;
    if (item.medida) mensaje += `   Medida: ${item.medida}\n`;
    mensaje += `   Presentación: ${item.presentacion || 'Presentación'}\n`;
    mensaje += `   Cantidad: ${item.cantidad}\n`;
    mensaje += `   Precio aplicado: ${money(item.precio)} por presentación\n`;
    if (item.nivel_precio) {
      mensaje += `   Nivel de precio: ${item.nivel_precio}\n`;
    }
    mensaje += `   Contenido total: ${item.contenido_total} ${item.unidad_base || 'unidades'}\n`;
    if (item.sku) mensaje += `   SKU: ${item.sku}\n`;
    mensaje += `   Subtotal: ${money(item.subtotal)}\n\n`;
  });

  mensaje += `*TOTAL: ${money(total)}*\n\n`;
  mensaje += 'La existencia y el precio serán confirmados por la sucursal al preparar el pedido.';

  const params = new URLSearchParams({
    phone: NUMERO_WHATSAPP,
    text: mensaje,
  });
  return `https://api.whatsapp.com/send?${params.toString()}`;
}

// ── Notificación WhatsApp al cliente (admin → cliente) ──────────────────────
export function notificarCliente(pedido, articulosSurtidos = null) {
  const { cliente_nombre: nombre, cliente_telefono: tel, folio, estado, tipo_entrega, direccion } = pedido;
  const esEnvio = tipo_entrega === 'envio';

  const EMOJI = {
    caja: String.fromCodePoint(0x1F4E6),
    check: String.fromCodePoint(0x2705),
    cruz: String.fromCodePoint(0x274C),
    alerta: String.fromCodePoint(0x26A0),
    dinero: String.fromCodePoint(0x1F4B0),
    fiesta: String.fromCodePoint(0x1F389),
    bolsa: String.fromCodePoint(0x1F6CD),
    mono: String.fromCodePoint(0x1F380),
    globo: String.fromCodePoint(0x1F388),
    festejo: String.fromCodePoint(0x1F973),
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

    if (esEnvio) {
      mensaje =
        `¡Hola ${nombre}! Tu pedido *${folio}* ya está listo y empacado. ${EMOJI.caja}\n\n` +
        `*Artículos incluidos:*\n${listaSurtidos}\n` +
        infoFaltantes +
        `\n${EMOJI.dinero} *Tu total a pagar es: ${SIMBOLO_MONEDA}${nuevoTotal.toFixed(2)}*\n\n` +
        `${String.fromCodePoint(0x1F69A)} Tu pedido saldrá pronto a domicilio. Te avisaremos cuando vaya en camino. ¡Gracias! ${EMOJI.fiesta}`;
    } else {
      mensaje =
        `¡Hola ${nombre}! Tu pedido *${folio}* ya está listo para recoger. ${EMOJI.caja}\n\n` +
        `*Artículos incluidos:*\n${listaSurtidos}\n` +
        infoFaltantes +
        `\n${EMOJI.dinero} *Tu total a pagar es: ${SIMBOLO_MONEDA}${nuevoTotal.toFixed(2)}*\n\n` +
        `${EMOJI.festejo} Puedes pasar a recogerlo cuando gustes. ¡Te esperamos!`;
    }

  } else {
    switch (estado) {
      case 'Por Surtir':
        mensaje = `¡Hola ${nombre}! ${EMOJI.fiesta} Recibimos tu pedido *${folio}* y ya está en nuestro sistema. En breve comenzamos a prepararlo. ¡Gracias por tu compra! ${EMOJI.bolsa}`;
        break;
      case 'Armando Pedido':
        mensaje = `¡Hola ${nombre}! ${EMOJI.mono} Te confirmamos que ya estamos preparando tu pedido *${folio}*. En cuanto esté listo te avisamos. ¡Pronto la fiesta! ${EMOJI.globo}`;
        break;
      case 'Listo para Entrega':
        mensaje = esEnvio
          ? `¡Buenas noticias ${nombre}! ${EMOJI.fiesta} Tu pedido *${folio}* ya está listo y saldrá pronto a domicilio. ¡Nos vemos pronto! ${String.fromCodePoint(0x1F69A)}`
          : `¡Buenas noticias ${nombre}! ${EMOJI.fiesta} Tu pedido *${folio}* ya está listo para recoger. Puedes pasar cuando gustes. ¡Te esperamos! ${EMOJI.festejo}`;
        break;
      case 'Enviado':
        mensaje = `¡Hola ${nombre}! ${String.fromCodePoint(0x1F69A)} Tu pedido *${folio}* ya salió de la tienda y va en camino hacia ti. Pronto lo tendrás. ¡Que lo disfrutes! ${EMOJI.globo}`;
        break;
      case 'Cancelado':
        mensaje = `Hola ${nombre}, lamentamos informarte que tu pedido *${folio}* ha sido cancelado. ${EMOJI.cruz}\n\nSi tienes dudas, no dudes en escribirnos. ¡Esperamos verte pronto! ${EMOJI.globo}`;
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
