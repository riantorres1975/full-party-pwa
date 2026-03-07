# 🛒 Catálogo Digital PWA

SPA de catálogo digital con carrito de compras e integración directa a WhatsApp.
Construida con **React + Vite + Tailwind CSS**, lista para desplegar en Netlify o Vercel.

---

## 🚀 Instalación rápida

```bash
# 1. Instalar dependencias
npm install

# 2. Modo desarrollo
npm run dev

# 3. Build de producción
npm run build

# 4. Vista previa del build
npm run preview
```

---

## ⚙️ Personalización

### 1. Configura tu negocio → `src/data/productos.js`

```js
export const NUMERO_WHATSAPP = '521XXXXXXXXXX'; // Tu número con código de país (sin + ni espacios)
export const NOMBRE_NEGOCIO  = 'Mi Tienda';     // Nombre que aparece en la app
export const MONEDA          = 'MXN';
export const SIMBOLO_MONEDA  = '$';
```

### 2. Agrega tus productos → `src/data/productos.js`

```js
export const productos = [
  {
    id: 1,
    nombre: 'Nombre del Producto',
    precio: 99.00,                     // número (sin símbolo)
    descripcion: 'Descripción corta',
    imagen_url: 'https://...',         // URL pública de la imagen
    categoria: 'principales',         // debe existir en el array `categorias`
  },
  // ...más productos
];
```

### 3. Edita las categorías (opcional)

```js
export const categorias = [
  { id: 'todo', label: 'Todo' },
  { id: 'entradas', label: 'Entradas' },
  // agrega o quita según tu negocio
];
```

---

## 📱 Funcionalidades PWA

- **Instalable** en Android y iOS (Safari → "Agregar a pantalla de inicio")
- **Offline-ready** con Service Worker (Network First + cache fallback)
- **Modo standalone** (se ve como app nativa, sin barra del navegador)

Para íconos reales, reemplaza los archivos en `/public/icons/`:
- `icon-192.png` → 192×192 px
- `icon-512.png` → 512×512 px

---

## 🌐 Despliegue

### Netlify
```bash
npm run build
# Arrastra la carpeta /dist al dashboard de Netlify
# O conecta el repositorio de GitHub con build command: npm run build
```

### Vercel
```bash
npm install -g vercel
vercel --prod
```

---

## 📁 Estructura del proyecto

```
catalogo-pwa/
├── public/
│   ├── manifest.json       ← Configuración PWA
│   ├── sw.js               ← Service Worker
│   └── icons/              ← Íconos de la app (192 y 512px)
├── src/
│   ├── components/
│   │   ├── Header.jsx          ← Barra superior
│   │   ├── Buscador.jsx        ← Input + filtros de categoría
│   │   ├── ProductCard.jsx     ← Tarjeta individual de producto
│   │   ├── ProductGrid.jsx     ← Cuadrícula de productos
│   │   ├── CarritoDrawer.jsx   ← Panel del carrito + botón WhatsApp
│   │   └── FloatingCartButton.jsx ← Botón flotante del pedido
│   ├── data/
│   │   └── productos.js    ← ✏️ EDITA AQUÍ tus productos y config
│   ├── hooks/
│   │   ├── useCarrito.js   ← Lógica del carrito
│   │   └── usePWA.js       ← Prompt de instalación
│   ├── utils/
│   │   └── whatsapp.js     ← Generador del mensaje de WhatsApp
│   ├── App.jsx             ← Componente raíz
│   ├── main.jsx            ← Entry point + registro SW
│   └── index.css           ← Estilos globales + fuentes
├── index.html
├── vite.config.js
├── tailwind.config.js
└── package.json
```

---

## 💬 Mensaje de WhatsApp generado

Al confirmar el pedido, se abre WhatsApp con un mensaje como este:

```
🛒 *Nuevo Pedido — Mi Tienda*
📅 4 de marzo de 2026
────────────────────────────

1. *Pasta Carbonara*
   Cantidad: 2
   Precio unitario: $165.00
   Subtotal: $330.00

2. *Tiramisú Artesanal*
   Cantidad: 1
   Precio unitario: $95.00
   Subtotal: $95.00

────────────────────────────
💰 *TOTAL: $425.00*

Por favor, confirma mi pedido. ¡Gracias! 😊
```
