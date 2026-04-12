// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL NEGOCIO
// ─────────────────────────────────────────────────────────────────────────────
export const NUMERO_WHATSAPP   = import.meta.env.VITE_WHATSAPP_NUMBER;
export const NOMBRE_NEGOCIO    = import.meta.env.VITE_NOMBRE_NEGOCIO;
export const MONEDA            = import.meta.env.VITE_MONEDA;
export const SIMBOLO_MONEDA    = import.meta.env.VITE_SIMBOLO_MONEDA;
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

export function registrarMarca(marcaTexto) {
  const limpia = String(marcaTexto || '').trim();
  if (!limpia) return null;

  const existente = marcas.find(m => String(m || '').trim().toLowerCase() === limpia.toLowerCase());
  if (existente) return existente;

  marcas.push(limpia);
  return limpia;
}

export function registrarTamano(tamanoTexto) {
  const limpia = String(tamanoTexto || '').trim();
  if (!limpia) return null;

  const existente = tamanios.find(t => String(t || '').trim().toLowerCase() === limpia.toLowerCase());
  if (existente) return existente;

  tamanios.push(limpia);
  return limpia;
}

export const marcas = [];

export const tamanios = [];
