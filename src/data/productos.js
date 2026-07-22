// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL NEGOCIO
// ─────────────────────────────────────────────────────────────────────────────
export const NUMERO_WHATSAPP   = import.meta.env.VITE_WHATSAPP_NUMBER;
export const NOMBRE_NEGOCIO    = import.meta.env.VITE_NOMBRE_NEGOCIO || 'Full Party';
// Moneda y símbolo se derivan del código de moneda
const MONEDAS = { MXN: '$', USD: '$', EUR: '€', GBP: '£', COP: '$', ARS: '$', CLP: '$', PEN: 'S/', BRL: 'R$' };
export const MONEDA            = import.meta.env.VITE_MONEDA || 'MXN';
export const SIMBOLO_MONEDA    = MONEDAS[MONEDA] || '$';
export const DIRECCION_TIENDA  = import.meta.env.VITE_DIRECCION_TIENDA;
export const HORARIO_TIENDA    = import.meta.env.VITE_HORARIO_TIENDA;
export const MAPS_URL_TIENDA   = import.meta.env.VITE_MAPS_URL_TIENDA;

export const categorias = [];

export function registrarCategoria(categoriaTexto) {
  const limpia = String(categoriaTexto || '').trim();
  if (!limpia) return null;

  const existente = categorias.find(c =>
    String(c.id || '').trim().toLowerCase() === limpia.toLowerCase() ||
    String(c.label || '').trim().toLowerCase() === limpia.toLowerCase()
  );

  if (existente) return existente.id;

  categorias.push({ id: limpia, label: limpia });
  return limpia;
}

export function actualizarCategoria(categoriaActual, categoriaNueva) {
  const actual = String(categoriaActual || '').trim();
  const nueva = String(categoriaNueva || '').trim();
  if (!actual || !nueva) return null;

  const idx = categorias.findIndex(c => String(c.id || '').trim() === actual);
  if (idx < 0) return null;

  const existente = categorias.find(c =>
    String(c.id || '').trim().toLowerCase() === nueva.toLowerCase() ||
    String(c.label || '').trim().toLowerCase() === nueva.toLowerCase()
  );

  if (existente && String(existente.id || '').trim() !== actual) {
    return existente.id;
  }

  categorias[idx] = { id: nueva, label: nueva };
  return nueva;
}

export function eliminarCategoria(categoriaId) {
  const id = String(categoriaId || '').trim();
  if (!id) return false;
  const idx = categorias.findIndex(c => String(c.id || '').trim() === id);
  if (idx < 0) return false;
  categorias.splice(idx, 1);
  return true;
}

export function registrarMarca(marcaTexto) {
  const limpia = String(marcaTexto || '').trim();
  if (!limpia) return null;

  const existente = marcas.find(m => String(m || '').trim().toLowerCase() === limpia.toLowerCase());
  if (existente) return existente;

  marcas.push(limpia);
  return limpia;
}

export function actualizarMarca(marcaActual, marcaNueva) {
  const actual = String(marcaActual || '').trim();
  const nueva = String(marcaNueva || '').trim();
  if (!actual || !nueva) return null;

  const idx = marcas.findIndex(m => String(m || '').trim() === actual);
  if (idx < 0) return null;

  const existente = marcas.find(m => String(m || '').trim().toLowerCase() === nueva.toLowerCase());
  if (existente && String(existente || '').trim() !== actual) return existente;

  marcas[idx] = nueva;
  return nueva;
}

export function eliminarMarca(marcaId) {
  const id = String(marcaId || '').trim();
  if (!id) return false;
  const idx = marcas.findIndex(m => String(m || '').trim() === id);
  if (idx < 0) return false;
  marcas.splice(idx, 1);
  return true;
}

export function registrarTamano(tamanoTexto) {
  const limpia = String(tamanoTexto || '').trim();
  if (!limpia) return null;

  const existente = tamanios.find(t => String(t || '').trim().toLowerCase() === limpia.toLowerCase());
  if (existente) return existente;

  tamanios.push(limpia);
  return limpia;
}

export function actualizarTamano(tamanoActual, tamanoNuevo) {
  const actual = String(tamanoActual || '').trim();
  const nuevo = String(tamanoNuevo || '').trim();
  if (!actual || !nuevo) return null;

  const idx = tamanios.findIndex(t => String(t || '').trim() === actual);
  if (idx < 0) return null;

  const existente = tamanios.find(t => String(t || '').trim().toLowerCase() === nuevo.toLowerCase());
  if (existente && String(existente || '').trim() !== actual) return existente;

  tamanios[idx] = nuevo;
  return nuevo;
}

export function eliminarTamano(tamanoId) {
  const id = String(tamanoId || '').trim();
  if (!id) return false;
  const idx = tamanios.findIndex(t => String(t || '').trim() === id);
  if (idx < 0) return false;
  tamanios.splice(idx, 1);
  return true;
}

export const marcas = [];

export const tamanios = [];
