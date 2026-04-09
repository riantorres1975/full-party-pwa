// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL NEGOCIO
// ─────────────────────────────────────────────────────────────────────────────
export const NUMERO_WHATSAPP   = import.meta.env.VITE_WHATSAPP_NUMBER;
export const NOMBRE_NEGOCIO    = import.meta.env.VITE_NOMBRE_NEGOCIO;
export const MONEDA            = 'MXN';
export const SIMBOLO_MONEDA    = '$';
export const DIRECCION_TIENDA  = import.meta.env.VITE_DIRECCION_TIENDA  || 'Uruapan, Michoacán';
export const HORARIO_TIENDA    = import.meta.env.VITE_HORARIO_TIENDA    || 'Lun–Sáb 9am–7pm';
export const MAPS_URL_TIENDA   = import.meta.env.VITE_MAPS_URL_TIENDA   || '';

// ─────────────────────────────────────────────────────────────────────────────
// OPCIONES DE FILTRADO
// Agrega/quita valores según tu inventario real.
// ─────────────────────────────────────────────────────────────────────────────
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

export const marcas = [
  'Glomex',
  'Sempertex',
  'Decoratex',
  'Full Party',
  'El Bueno',
  'Mega Shine',
  'Peyma',
  'Genérico',
];

export const tamanios = [
  '5',
  '10',
  '12',
  '18',
  '24',
  '36',
  'Número 16',
  'Número 32',
  'Número 40',
  'Kit completo',
];

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTOS
// Campos: id, nombre, precio, descripcion, imagen_url,
//         categoria, marca (opcional), tamano (opcional)
// ─────────────────────────────────────────────────────────────────────────────
export const productos = [
  {
    id: 1,
    nombre: 'Globo Metálico Estrella',
    precio: 45,
    descripcion: 'Globo metálico en forma de estrella ideal para decorar fiestas.',
    imagen_url: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=600&q=80',
    categoria: 'globos-metal',
    marca: 'Anagram',
    tamano: '18 pulgadas',
  },
  {
    id: 2,
    nombre: 'Globo Metálico Corazón',
    precio: 45,
    descripcion: 'Globo metálico en forma de corazón para celebraciones.',
    imagen_url: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?w=600&q=80',
    categoria: 'globos-metal',
    marca: 'Anagram',
    tamano: '18 pulgadas',
  },
  {
    id: 3,
    nombre: 'Globo Número 1',
    precio: 75,
    descripcion: 'Globo metálico número 1 para cumpleaños.',
    imagen_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80',
    categoria: 'globos-numeros',
    marca: 'Qualatex',
    tamano: '34 pulgadas',
  },
  {
    id: 4,
    nombre: 'Globo Número 2',
    precio: 75,
    descripcion: 'Globo metálico número 2 para cumpleaños.',
    imagen_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80',
    categoria: 'globos-numeros',
    marca: 'Qualatex',
    tamano: '34 pulgadas',
  },
  {
    id: 5,
    nombre: 'Globo Número 3',
    precio: 75,
    descripcion: 'Globo metálico número 3 para cumpleaños.',
    imagen_url: 'https://images.unsplash.com/photo-1527529482837-4698179dc6ce?w=600&q=80',
    categoria: 'globos-numeros',
    marca: 'Qualatex',
    tamano: '34 pulgadas',
  },
  {
    id: 6,
    nombre: 'Globo Látex Colores',
    precio: 65,
    descripcion: 'Bolsa de globos de látex de colores surtidos.',
    imagen_url: 'https://images.unsplash.com/photo-1561489396-888724a1543d?w=600&q=80',
    categoria: 'globos-latex',
    marca: 'Sempertex',
    tamano: '12 pulgadas',
  },
  {
    id: 7,
    nombre: 'Globo Transparente con Confeti',
    precio: 55,
    descripcion: 'Globo transparente relleno de confeti.',
    imagen_url: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=600&q=80',
    categoria: 'globos',
    marca: 'Sempertex',
    tamano: '18 pulgadas',
  },
  {
    id: 8,
    nombre: 'Guirnalda Feliz Cumpleaños',
    precio: 55,
    descripcion: 'Decoración colgante de Feliz Cumpleaños.',
    imagen_url: 'https://images.unsplash.com/photo-1558636508-e0db3814bd1d?w=600&q=80',
    categoria: 'decoracion',
    marca: 'Party Deco',
    tamano: '2 metros',
  },
 
];
