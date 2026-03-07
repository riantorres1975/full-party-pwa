# 🎉 Catálogo Digital PWA — Full Party Uruapan

Catálogo digital para tienda de artículos de fiesta, construido como Progressive Web App (PWA) con React + Vite + Tailwind CSS, conectado a Supabase como backend.

---

## 🛠️ Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | UI y estado |
| Vite | 5.4 | Bundler y dev server |
| Tailwind CSS | 3.4 | Estilos |
| Supabase JS | 2.45 | Base de datos, Auth y Realtime |
| lucide-react | latest | Íconos (Facebook, etc.) |
| PWA nativa | — | Service Worker + manifest.json |

---

## 📁 Estructura del proyecto

```
catalogo-pwa/
├── .env                          ← credenciales (no subir a git)
├── .env.example                  ← plantilla de variables
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
│
├── public/
│   ├── manifest.json             ← configuración PWA
│   └── sw.js                     ← Service Worker (Network First)
│
├── supabase_setup.sql            ← tabla productos + RLS
├── supabase_pedidos.sql          ← tabla pedidos + folios + RLS
├── supabase_estados_update.sql   ← migración de estados
│
└── src/
    ├── main.jsx                  ← entry point + registro SW
    ├── AppRouter.jsx             ← enrutador hash (#/admin)
    ├── App.jsx                   ← catálogo público
    ├── index.css                 ← estilos globales + fuentes
    │
    ├── lib/
    │   └── supabase.js           ← cliente singleton de Supabase
    │
    ├── data/
    │   └── productos.js          ← config del negocio + filtros
    │
    ├── hooks/
    │   ├── useAuth.js            ← sesión Supabase Auth
    │   ├── useCarrito.js         ← carrito con localStorage
    │   ├── useInfiniteScroll.js  ← IntersectionObserver
    │   ├── usePedido.js          ← insert/buscar pedidos
    │   ├── useProductos.js       ← fetch productos desde Supabase
    │   └── usePWA.js             ← prompt de instalación PWA
    │
    ├── utils/
    │   └── whatsapp.js           ← genera URL de WhatsApp con folio
    │
    └── components/
        ├── Header.jsx            ← logo + botón carrito
        ├── BuscadorFiltros.jsx   ← input búsqueda + pills activas
        ├── ModalFiltros.jsx      ← bottom sheet filtros avanzados
        ├── ProductGrid.jsx       ← grid con infinite scroll
        ├── ProductCard.jsx       ← tarjeta de producto
        ├── ProductosSkeleton.jsx ← skeleton de carga
        ├── FloatingCartButton.jsx← barra flotante total + carrito
        ├── CarritoDrawer.jsx     ← drawer de pedido + checkout
        ├── RastreoPedido.jsx     ← stepper de estado de pedido
        ├── RedesSociales.jsx     ← botones Facebook y TikTok
        ├── LoginAdmin.jsx        ← login protegido para admin
        ├── AdminPedidos.jsx      ← dashboard de gestión de pedidos
        └── InputDireccion.jsx    ← (reservado) autocomplete Nominatim
```

---

## ⚙️ Instalación y configuración

### 1. Instalar dependencias

```bash
npm install
npm install lucide-react
```

### 2. Configurar variables de entorno

Copia `.env.example` como `.env` y rellena con tus credenciales de Supabase:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Las credenciales se encuentran en **Supabase Dashboard → Settings → API**.

### 3. Configurar la base de datos

Ejecuta los siguientes scripts en **Supabase → SQL Editor**, en este orden:

```
1. supabase_setup.sql          ← tabla productos, índices, RLS
2. supabase_pedidos.sql        ← tabla pedidos, función folio, RLS
3. supabase_estados_update.sql ← constraint de estados actuales
```

### 4. Habilitar Realtime

En **Supabase → Database → Replication**, activa la tabla `pedidos`. O ejecuta:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
```

### 5. Crear usuario administrador

En **Supabase → Authentication → Users → Add user**, crea el usuario con email y contraseña para acceder al panel de admin.

### 6. Levantar el servidor

```bash
npm run dev
```

---

## 🔧 Personalización del negocio

Edita `src/data/productos.js` — es el único archivo que necesitas tocar para configurar la tienda:

```js
export const NUMERO_WHATSAPP = '521XXXXXXXXXX'; // con código de país, sin +
export const NOMBRE_NEGOCIO  = 'Mi Tienda';
export const MONEDA          = 'MXN';
export const SIMBOLO_MONEDA  = '$';
```

### Agregar categorías, marcas y tamaños

```js
export const categorias = [
  { id: 'globos',       label: '🎈 Globos'         },
  { id: 'globos-metal', label: '✨ Globos Metálicos' },
  { id: 'pinatas',      label: '🪅 Piñatas'         },
  // agrega más aquí...
];
```

### Estructura de un producto en Supabase

| Campo | Tipo | Requerido |
|---|---|---|
| `id` | UUID (auto) | ✅ |
| `nombre` | TEXT | ✅ |
| `precio` | NUMERIC(10,2) | ✅ |
| `descripcion` | TEXT | — |
| `imagen_url` | TEXT | — |
| `categoria` | TEXT | — |
| `marca` | TEXT | — |
| `tamano` | TEXT | — |
| `activo` | BOOLEAN | ✅ (default: true) |

> Poner `activo = false` muestra el producto como **"Agotado"** en el catálogo sin eliminarlo.

---

## 🚀 Funcionalidades

### Catálogo público

- **Productos dinámicos** desde Supabase con skeleton de carga y manejo de errores
- **Infinite scroll** con `IntersectionObserver` — carga de 12 en 12 productos
- **Lazy loading** nativo de imágenes (`loading="lazy"`)
- **Búsqueda en tiempo real** por nombre, descripción, marca y tamaño
- **Filtros múltiples** por categoría, marca y tamaño (AND entre dimensiones, OR dentro)
- **Estado agotado** — tarjeta en escala de grises con badge y botón deshabilitado
- **Redes sociales** — botones de Facebook y TikTok con hover animado

### Carrito y checkout

- **Persistencia en localStorage** — el carrito sobrevive recargas accidentales
- **Formulario de entrega** — toggle entre "Recoger en tienda" y "Envío a domicilio"
- **Validación en tiempo real** — teléfono de exactamente 10 dígitos
- **Formato automático de nombre** — capitaliza primera letra de cada palabra respetando acentos
- **Limpieza de teléfono** — elimina espacios del autocompletado antes de enviar
- **Integración WhatsApp** — mensaje formateado con emojis, productos, total y folio
- **Folio en el mensaje** — incluye el número de pedido (`FP-XXXX`) generado por Supabase

### Sistema de pedidos

- **Registro automático** en tabla `pedidos` al confirmar por WhatsApp
- **Folio único** generado por función SQL (`FP-XXXX`)
- **Rastreo de pedido** — el cliente busca por folio o teléfono y ve un stepper animado

#### Estados del pedido

| Estado | Emoji | Color |
|---|---|---|
| Por Surtir | 🛍️ | Rojo |
| Armando Pedido | 🎀 | Amarillo |
| Listo para Entrega | 🎉 | Verde |

### Panel de administración

Acceso en: `https://tudominio.com/#/admin`

- **Login protegido** con Supabase Auth (email + contraseña)
- **Dashboard de pedidos** con tarjetas individuales por pedido
- **Filtros rápidos** por estado + buscador por folio, nombre o teléfono
- **Tarjetas resumen** con contador por estado, filtrables con un tap
- **Cambio de estado** con botones de un toque y actualización optimista
- **Realtime automático** — nuevos pedidos aparecen solos sin recargar
  - `INSERT` → aparece arriba de la lista al instante
  - `UPDATE` → solo esa tarjeta se actualiza
  - `DELETE` → la tarjeta desaparece

### PWA

- Instalable en Android e iOS desde el navegador
- Service Worker con estrategia **Network First** y cache fallback
- Funciona offline con los últimos datos cacheados

---

## 🗺️ Rutas

| URL | Vista | Protección |
|---|---|---|
| `/` | Catálogo público | — |
| `/#/admin` | Panel de administración | Requiere sesión Supabase Auth |

El enrutamiento es por **hash** (`window.location.hash`) sin react-router, para mayor simplicidad y compatibilidad con deploy estático.

---

## 🗄️ Base de datos — Resumen de tablas

### `productos`
Gestionada desde el Dashboard de Supabase o con SQL. El catálogo la lee en tiempo de carga.

### `pedidos`

| Campo | Tipo | Descripción |
|---|---|---|
| `id` | UUID | PK auto |
| `folio` | TEXT UNIQUE | Generado: `FP-XXXX` |
| `cliente_nombre` | TEXT | Capitalizado automáticamente |
| `cliente_telefono` | TEXT | 10 dígitos sin espacios |
| `tipo_entrega` | TEXT | `tienda` o `envio` |
| `direccion` | TEXT | Solo si es envío |
| `total` | NUMERIC | Total del pedido |
| `estado` | TEXT | `Por Surtir` / `Armando Pedido` / `Listo para Entrega` |
| `detalles_json` | JSONB | Array de productos del carrito |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto via trigger |

---

## 🌐 Deploy

```bash
npm run build   # genera la carpeta /dist
```

Sube `/dist` a **Netlify** o **Vercel** y agrega las variables de entorno en el panel del hosting.

---

## 📋 Scripts disponibles

```bash
npm run dev      # servidor de desarrollo en http://localhost:5173
npm run build    # build de producción en /dist
npm run preview  # previsualizar el build localmente
```

---

## 🔗 Links útiles

- [Supabase Dashboard](https://supabase.com)
- [Documentación Supabase JS](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev)
