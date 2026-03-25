# 🎉 Catálogo Digital PWA — Full Party Uruapan

Catálogo digital para tienda de artículos de fiesta, construido como Progressive Web App (PWA) con React + Vite + Tailwind CSS y conectado a Supabase como backend en la nube.

---

## 🛠️ Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | UI y manejo de estado |
| Vite | 5.4 | Bundler y dev server |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| Supabase JS | 2.45 | Base de datos, Auth y Realtime |
| lucide-react | latest | Íconos SVG |
| PWA nativa | — | Service Worker + manifest.json |

---

## 📁 Estructura del proyecto

```
catalogo-pwa/
├── .env                           ← credenciales (NO subir a git)
├── .env.example                   ← plantilla de variables
├── .gitignore
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
│
├── public/
│   ├── manifest.json              ← configuración PWA (nombre, íconos, colores)
│   └── sw.js                      ← Service Worker — estrategia Network First
│
├── supabase_setup.sql             ← tabla productos + índices + RLS
├── supabase_estados_update.sql    ← migración a los 3 estados actuales
├── supabase_notificado.sql        ← agrega/sincroniza `notificado_estado` en pedidos
├── supabase_storage_productos.sql ← políticas de Storage para bucket `productos-imagenes`
│
└── src/
    ├── main.jsx                   ← entry point + registro del Service Worker
    ├── AppRouter.jsx              ← enrutador por hash (/ y /#/admin)
    ├── App.jsx                    ← catálogo público principal
    ├── index.css                  ← estilos globales, fuentes y animaciones
    │
    ├── lib/
    │   └── supabase.js            ← cliente singleton de Supabase
    │
    ├── data/
    │   └── productos.js           ← ✏️ configuración del negocio + listas de filtros
    │
    ├── hooks/
    │   ├── useAuth.js             ← sesión de Supabase Auth (login/logout)
    │   ├── useCarrito.js          ← carrito con persistencia en localStorage
    │   ├── useInfiniteScroll.js   ← IntersectionObserver para carga progresiva
    │   ├── usePedido.js           ← insert y búsqueda de pedidos (guarda imagen, tamaño y familia_mayoreo)
    │   ├── useProductos.js        ← fetch de productos desde Supabase
    │   └── usePWA.js              ← prompt de instalación PWA
    │
    ├── utils/
    │   └── whatsapp.js            ← genera URL de WhatsApp con folio incluido
    │
    └── components/
        ├── Header.jsx             ← logo + botón de carrito con badge
        ├── BuscadorFiltros.jsx    ← buscador de texto + pills de filtros activos
        ├── ModalFiltros.jsx       ← bottom sheet con filtros por categoría/marca/tamaño
        ├── ProductGrid.jsx        ← grid con infinite scroll y centinela
        ├── ProductCard.jsx        ← tarjeta de producto con estado agotado
        ├── ProductosSkeleton.jsx  ← skeletons animados mientras carga Supabase
        ├── FloatingCartButton.jsx ← barra flotante con total y acceso al carrito
        ├── CarritoDrawer.jsx      ← drawer de pedido + formulario + checkout
        ├── RastreoPedido.jsx      ← stepper visual de estado del pedido
        ├── RedesSociales.jsx      ← botones Facebook y TikTok con hover animado
        ├── LoginAdmin.jsx         ← login con email/contraseña (Supabase Auth)
        ├── AdminPedidos.jsx       ← dashboard de pedidos + vista de administración por hash
        ├── AdminCatalogo.jsx      ← módulo de catálogo (nuevo artículo + inventario)
        ├── FormularioNuevoProducto.jsx ← alta de productos con layout compacto de 2 columnas
        ├── ModalEditarProducto.jsx ← edición de productos en modal
        └── SelectCategoria.jsx    ← selector reutilizable de categoría
```

---

## ⚙️ Instalación y configuración

### 1. Instalar dependencias

```bash
npm install
npm install lucide-react
```

### 2. Variables de entorno

Copia `.env.example` como `.env` y rellena con tus credenciales:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Las credenciales están en **Supabase Dashboard → Settings → API**.

### 3. Crear las tablas en Supabase

Ejecuta estos scripts en **Supabase → SQL Editor**, en orden:

```
1. supabase_setup.sql             → tabla productos, índices y políticas RLS
2. supabase_estados_update.sql    → constraint con los 3 estados actuales en pedidos
3. supabase_notificado.sql        → columna `notificado_estado` para sincronizar notificaciones
4. supabase_storage_productos.sql → políticas de Storage para subir imágenes de producto
```

### 4. Habilitar Realtime

En **Supabase → Database → Replication** activa el toggle de la tabla `pedidos`.  
O con SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
```

### 5. Crear el usuario administrador

En **Supabase → Authentication → Users → Add user**, crea el usuario con email y contraseña que usarás para entrar al panel de admin.

### 6. Arrancar el servidor

```bash
npm run dev
# http://localhost:5173
```

---

## 🔧 Personalización del negocio

El único archivo que necesitas editar para configurar la tienda es `src/data/productos.js`:

```js
export const NUMERO_WHATSAPP = '521XXXXXXXXXX'; // código de país + número, sin +
export const NOMBRE_NEGOCIO  = 'Full Party Uruapan';
export const MONEDA          = 'MXN';
export const SIMBOLO_MONEDA  = '$';
```

### Categorías, marcas y tamaños disponibles en filtros

```js
export const categorias = [
  { id: 'globos',       label: '🎈 Globos'         },
  { id: 'globos-metal', label: '✨ Globos Metálicos' },
  { id: 'pinatas',      label: '🪅 Piñatas'         },
  // agrega o quita según tu inventario...
];
```

---

## 🗄️ Estructura de la base de datos

### Tabla `productos`

| Campo | Tipo | Requerido | Notas |
|---|---|---|---|
| `id` | UUID | auto | PK generado por Supabase |
| `nombre` | TEXT | ✅ | |
| `precio` | NUMERIC(10,2) | ✅ | |
| `descripcion` | TEXT | — | |
| `imagen_url` | TEXT | — | URL externa o bucket de Supabase |
| `categoria` | TEXT | — | Debe coincidir con `categorias` en productos.js |
| `marca` | TEXT | — | |
| `tamano` | TEXT | — | |
| `activo` | BOOLEAN | ✅ | `false` = se muestra como **Agotado** |
| `familia_mayoreo` | TEXT | — | Opcional — para mostrar en la lista de artículos del admin |
| `created_at` | TIMESTAMPTZ | auto | |

### Tabla `pedidos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK auto |
| `folio` | TEXT UNIQUE | Generado automáticamente: `FP-XXXX` |
| `cliente_nombre` | TEXT | Capitalizado en el frontend |
| `cliente_telefono` | TEXT | 10 dígitos, sin espacios |
| `tipo_entrega` | TEXT | `tienda` o `envio` |
| `direccion` | TEXT | Solo cuando es envío a domicilio |
| `total` | NUMERIC | Total del pedido en MXN |
| `estado` | TEXT | Ver estados abajo |
| `detalles_json` | JSONB | Array con los productos del carrito — campos: `id`, `nombre`, `precio`, `cantidad`, `imagen_url`, `tamano`, `familia_mayoreo`, `encontrado` |
| `notificado_estado` | TEXT | Estado en que se notificó al cliente por última vez — compartido entre sesiones vía Realtime |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto via trigger |

#### Estados del pedido

| Estado | Emoji | Color | Significado |
|---|---|---|---|
| `Por Surtir` | 🛍️ | Rojo | Pedido recién recibido |
| `Armando Pedido` | 🎀 | Amarillo | En preparación |
| `Listo para Entrega` | 🎉 | Verde | Listo para recoger o enviar |

---

## 🚀 Funcionalidades

### Catálogo público (`/`)

- Productos dinámicos desde Supabase con skeleton de carga y pantalla de error con reintento
- **Infinite scroll** nativo con `IntersectionObserver` — carga 12 productos iniciales y agrega 12 más al llegar al final
- **Lazy loading** de imágenes con atributo `loading="lazy"`
- **Búsqueda en tiempo real** por nombre, descripción, marca y tamaño
- **Filtros múltiples** por categoría, marca y tamaño — AND entre dimensiones, OR dentro de cada una
- **Estado agotado** — imagen en escala de grises, badge "😔 Agotado" y botón deshabilitado cuando `activo = false`
- **Botones de redes sociales** — Facebook y TikTok con transición suave al hover

### Carrito y checkout

- **Persistencia en localStorage** — el carrito sobrevive recargas accidentales con clave `carritoPWA`
- **Formulario de entrega** — toggle entre "🏪 Recoger en tienda" y "🚚 Envío a domicilio"
- **Validación en tiempo real** — nombre requerido, teléfono de exactamente 10 dígitos
- **Formato automático de nombre** — capitaliza la primera letra de cada palabra respetando acentos (`León`, `Pérez`)
- **Limpieza de teléfono** — elimina espacios del autocompletado del celular antes de enviar
- **Mensaje de WhatsApp formateado** — incluye folio, cliente, productos, totales y tipo de entrega
- **Botón deshabilitado** mientras el pedido se guarda en Supabase (spinner de carga)

### Sistema de pedidos y rastreo

- Al confirmar, el pedido se registra en Supabase antes de abrir WhatsApp
- **Folio único** generado por función SQL (`FP-XXXX`) incluido en el mensaje
- Si Supabase falla, WhatsApp se abre igual (degradación elegante, sin folio)
- **Rastreo público** — el cliente ingresa su folio o teléfono y ve un stepper animado con el estado actual

### Panel de administración (`/#/admin`)

- **Login protegido** con Supabase Auth — email y contraseña
- **Navegación interna por hash** entre `/#/admin` (Pedidos) y `/#/admin/catalogo` (Catálogo)
- **Tarjetas resumen** filtrables: Total / Por Surtir / Armando Pedido / Listo para Entrega
- **Buscador** por folio, nombre de cliente o teléfono
- **Cambio de estado** con botones de un toque y actualización optimista
- **Realtime automático** vía `postgres_changes`:
  - `INSERT` → nuevo pedido aparece arriba sin recargar
  - `UPDATE` → solo esa tarjeta se actualiza en todas las sesiones abiertas
  - `DELETE` → la tarjeta desaparece
- **Lista de artículos expandible** — acordeón en cada tarjeta con miniatura, nombre, tamaño, familia de mayoreo, cantidad y precio. El color del acordeón se adapta al estado del pedido
- **Picking dinámico** — cuando el pedido está en "Armando Pedido" el acordeón cambia a modo surtido:
  - Checkboxes táctiles grandes por artículo, todos marcados por defecto
  - Al desmarcar un artículo: se tacha visualmente, imagen en escala de grises, y se actualiza `activo = false` en la tabla `productos` para marcarlo como agotado en el catálogo público en tiempo real
  - Al volver a marcar: restaura `activo = true`
  - Panel de totales dinámico con total original, descuento por faltantes y nuevo total
  - Badge del encabezado muestra `entregados/total` cuando hay faltantes
  - Botón **"Pasar a Listo"** que en un solo `UPDATE` a Supabase: cambia el estado, guarda el total ajustado, persiste `encontrado: true/false` por artículo en `detalles_json`, y abre WhatsApp con mensaje detallado automáticamente
- **Vista "Listo para Entrega"**: los artículos no entregados se muestran con imagen en escala de grises, nombre y precio tachados, y el panel de descuento visible para referencia
- **Notificación al cliente por WhatsApp** — sincronizada entre sesiones via `notificado_estado` en Supabase:
  - Se desactiva ("✓ Cliente notificado") tras enviarlo en todas las sesiones simultáneamente
  - Se reactiva al cambiar el estado del pedido
  - Al usar "Pasar a Listo" desde picking, el botón queda desactivado automáticamente ya que el mensaje se envía en el mismo acto

### Gestión de catálogo (`/#/admin/catalogo`)

- **Alta de productos** con formulario compacto en dos columnas (core data + details/media) para capturar más rápido sin scroll interno en pantallas estándar
- **Carga de imagen dual**: por archivo (JPG/PNG/GIF/WEBP/AVIF) o por URL externa, con vista previa local inmediata
- **Inventario administrable** con búsqueda por nombre, marca, tamaño o categoría
- **Toggle de disponibilidad** por producto (actualiza `activo` en tiempo real)
- **Edición completa** en modal (nombre, descripción, precio, categoría, marca, tamaño, imagen y disponibilidad)
- **Eliminación de productos** con confirmación para evitar borrados accidentales

#### Mensajes de notificación por estado

| Estado | Contenido del mensaje |
|---|---|
| Por Surtir | Confirmación de recepción del pedido |
| Armando Pedido | Aviso de que el pedido está en preparación |
| Listo para Entrega (picking) | Lista de ✅ artículos entregados, ❌ faltantes si los hay, y 💰 nuevo total ajustado |
| Listo para Entrega (manual) | Notificación de que ya puede pasar o sale a domicilio |

### PWA

- Instalable en Android e iOS desde el navegador (botón "Agregar a pantalla de inicio")
- Service Worker con estrategia **Network First** — usa cache como fallback sin conexión
- Funciona offline mostrando los últimos datos cacheados

---

## 🗺️ Rutas

| URL | Vista | Protección |
|---|---|---|
| `/` | Catálogo público | — |
| `/#/admin` | Panel de administración (Pedidos) | Requiere sesión activa de Supabase Auth |
| `/#/admin/catalogo` | Gestión de catálogo | Requiere sesión activa de Supabase Auth |

Enrutamiento por **hash** (`window.location.hash`) sin react-router — compatible con cualquier hosting estático sin configuración adicional.

---

## 🌐 Deploy en producción

```bash
npm run build   # genera la carpeta /dist lista para subir
```

Sube la carpeta `/dist` a **Netlify** o **Vercel** y agrega las variables de entorno (`VITE_SUPABASE_URL` y `VITE_SUPABASE_ANON_KEY`) en la configuración del hosting.

> En Netlify agrega un archivo `public/_redirects` con el contenido `/* /index.html 200` para que la navegación funcione correctamente al recargar.

---

## 📋 Scripts disponibles

```bash
npm run dev      # servidor de desarrollo → http://localhost:5173
npm run build    # build de producción   → /dist
npm run preview  # previsualizar el build localmente
```

---

## 🔗 Referencias

- [Supabase Dashboard](https://supabase.com)
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev)
- [lucide-react](https://lucide.dev)
