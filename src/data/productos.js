// ─────────────────────────────────────────────────────────────────────────────
// CONFIGURACIÓN DEL NEGOCIO
// ─────────────────────────────────────────────────────────────────────────────
export const NUMERO_WHATSAPP = '5214521040377';
export const NOMBRE_NEGOCIO  = 'Full Party Uruapan';
export const MONEDA          = 'MXN';
export const SIMBOLO_MONEDA  = '$';

// ─────────────────────────────────────────────────────────────────────────────
// OPCIONES DE FILTRADO
// Agrega/quita valores según tu inventario real.
// ─────────────────────────────────────────────────────────────────────────────
export const categorias = [
  { id: 'globo-latex',          label: '🎈 Globos'             },
  { id: 'desechables',     label: '🍽️ Desechables'        },
  { id: 'decoracion',      label: '✨ Decoración'         },
  { id: 'globo-latex',     label: '🎈 Globos Latex'       },
  { id: 'globo-número-16', label: '✨ Globos Números'     },
  { id: 'guirnalda',       label: '🎉 Guirnaldas'         },
  { id: 'cortina-metalica',label: '🎊 Cortinas'           },
  { id: 'banderines',      label: '🎏 Banderines'         },
  { id: 'Cumpleaños',      label: '🎂 Cumpleaños'         },
  { id: 'vela-número',     label: '🕯️ Vela Número'        },
  { id: 'orbz',            label: '🔮 Orbz'               },
  { id: 'Infladora-globos',label: '💨 Infladora de Globos'},
  { id: 'kits',            label: '🎁 Kits de Decoración' },
  { id: 'batucada',        label: '🥁 Batucada'           },
];

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
  '5 ',
  '10 ',
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