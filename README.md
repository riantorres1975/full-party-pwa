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
├── supabase_setup.sql             ← Script único de BD (Tablas, RLS, Políticas de Admin)
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
    │   ├── useCarrito.js          ← carrito con persistencia en localStorage + total dinámico mayoreo
    │   ├── useConfirm.js          ← hook para modal de confirmación (promesa)
    │   ├── useInfiniteScroll.js   ← IntersectionObserver para carga progresiva
    │   ├── usePedido.js           ← insert y búsqueda de pedidos (guarda precio aplicado por línea)
    │   ├── useProductos.js        ← fetch de productos desde Supabase
    │   └── usePWA.js              ← prompt de instalación PWA
    │
    ├── utils/
    │   ├── precios.js             ← calcula precio aplicable por mayoreo
    │   ├── validarTelefono.js     ← validación de teléfonos mexicanos (ladas IFT)
    │   └── whatsapp.js            ← genera URL de WhatsApp con precio aplicado por artículo
    │
    ├── __tests__/
    │   └── seguridad.test.mjs     ← suite de pruebas de seguridad (52 tests)
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
        ├── GestorPrecios.jsx      ← editor de precios escalonados por mayoreo
        ├── SelectCategoria.jsx    ← selector reutilizable de categoría
        │
        └── ui/                        ← componentes reutilizables del design system
            ├── Toggle.jsx             ← toggle switch unificado (sm/md, accesible)
            ├── ToastProvider.jsx      ← sistema de notificaciones toast + useToast hook
            ├── ConfirmModal.jsx       ← modal de confirmación (reemplaza window.confirm)
            ├── Skeleton.jsx           ← skeleton loaders (pedido, producto)
            └── BottomNav.jsx          ← navegación inferior mobile con badges
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
VITE_WHATSAPP_NUMBER="521XXXXXXXXXX"
VITE_NOMBRE_NEGOCIO="Tu Negocio"
```

Las credenciales están en **Supabase Dashboard → Settings → API**.

### 3. Crear las tablas en Supabase

Ejecuta el script unificado en **Supabase → SQL Editor**:

```text
1. supabase_setup.sql  → Tablas, índices, y candados de seguridad (Políticas RLS rigurosas).
```

> **IMPORTANTE:** Lee el final del archivo `supabase_setup.sql` para el paso manual de asignar tu propio UUID a la tabla segura `public.admins`, lo cual te habilitará para leer pedidos completos y editar el catálogo.

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

El único archivo complementario que necesitas editar para configurar la clasificación en tu tienda es `src/data/productos.js` (El nombre de tu negocio y teléfono operan ahora en tus variables de entorno seguras `.env`):

```js
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
| `stock_ilimitado` | BOOLEAN | ✅ | Por defecto `true`, ignora validación de stock |
| `stock_actual` | NUMERIC | — | La cantidad actual disponible en tienda |
| `stock_minimo` | NUMERIC | — | Activa la alerta visual de *Stock Bajo* |
| `precios_mayoreo` | JSONB | — | Escalas por volumen: `[{ etiqueta, cantidad_minima, precio }]` |
| `familia_mayoreo` | TEXT | — | Campo legado opcional (compatibilidad histórica) |
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
| `detalles_json` | JSONB | Array con snapshot de carrito — campos: `id`, `nombre`, `precio` (aplicado), `precio_base`, `cantidad`, `imagen_url`, `tamano`, `precios_mayoreo`, `familia_mayoreo`, `encontrado` |
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

- **Diseño Premium y Responsivo** — interfaz estética, minimalista, con sombras, gradientes y animaciones sutiles
- **Grid optimizado para desktop** — distribución adaptativa de 5-6 columnas en pantallas grandes con sidebar compacto y aprovechamiento máximo del ancho
- **Modo Claro y Oscuro (Dark Mode)** — alternable desde el header para todas las vistas
- **Filtros optimizados para gran escala** — listas de categorías con buscador interno (*inline*) para catálogos extensos (+50)
- **Modal de Detalle Inteligente** — *bottom-sheet* en móvil y *side-by-side* optimizado en desktop
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
- **Validación en tiempo real** — nombre requerido, teléfono validado contra ladas reales de México (IFT)
- **Validación de ladas mexicanas** — solo acepta números con códigos de área reales (55, 33, 81, 452, etc.); rechaza ladas falsas, dígitos repetidos y secuencias obvias
- **Honeypot anti-bot** — campo invisible que detecta bots y descarta pedidos spam silenciosamente
- **Rate limit por sesión** — máximo 5 pedidos cada 30 minutos por sesión del navegador
- **Validación de stock en carrito** — el drawer respeta el stock máximo y no permite agregar más unidades de las disponibles
- **Formato automático de nombre** — capitaliza la primera letra de cada palabra respetando acentos (`León`, `Pérez`)
- **Limpieza de teléfono** — elimina espacios del autocompletado del celular antes de enviar
- **Precios escalonados por mayoreo** — cálculo automático por cantidad en carrito con `obtenerPrecioAplicable(...)`
- **UI de descuento por volumen** en carrito — precio base tachado + precio aplicado resaltado por artículo
- **Mensaje de WhatsApp formateado** — incluye precio aplicado y subtotal correcto por línea
- **Botón deshabilitado** mientras el pedido se guarda en Supabase (spinner de carga)

### Sistema de pedidos y rastreo

- Al confirmar, el pedido se registra en Supabase antes de abrir WhatsApp
- **Folio único** generado por función SQL (`FP-XXXX`) incluido en el mensaje
- Si Supabase falla, WhatsApp se abre igual (degradación elegante, sin folio)
- **Rastreo público** — el cliente ingresa su folio o teléfono y ve un stepper animado con el estado actual
- **Vista de rastreo centrada** — layout optimizado para desktop con ancho máximo para mejor legibilidad

### Panel de administración (`/#/admin`)

- **Diseño SaaS premium** — rediseño completo inspirado en Stripe/Shopify/Notion con design tokens unificados
- **Design system propio** — CSS custom properties (`--admin-*`) para dark mode sin `!important`, tokens semánticos de color, sombra y estado
- **Login split-screen** — branding a la izquierda + formulario a la derecha en desktop, con autofocus y animación de entrada
- **Sidebar desktop** — avatar con iniciales, nav con badges de pedidos pendientes, quick stats "Hoy", toggle de tema y botón de cerrar sesión
- **Bottom navigation mobile** — 3 tabs (Pedidos con badge, Catálogo, Cuenta) con indicador activo, safe-area compatible
- **Counter cards con estado** — accent bar lateral por color de estado, iconos circulares, número prominente, dot pulsante "live" en Por Surtir
- **Navegación interna por hash** entre `/#/admin` (Pedidos) y `/#/admin/catalogo` (Catálogo)
- **Buscador** por folio, nombre de cliente o teléfono
- **Cambio de estado** — dropdown custom en mobile, botones en desktop, con actualización optimista
- **Sistema de feedback** — toasts (success/error/info/warning) con auto-dismiss y progress bar, modal de confirmación estilizado (reemplaza window.alert/confirm), skeleton loaders
- **Realtime automático** vía `postgres_changes`:
  - `INSERT` → nuevo pedido aparece arriba sin recargar
  - `UPDATE` → solo esa tarjeta se actualiza en todas las sesiones abiertas
  - `DELETE` → la tarjeta desaparece
- **Lista de artículos expandible** — acordeón en cada tarjeta con miniatura, nombre, tamaño, familia de mayoreo, cantidad y precio. El color del acordeón se adapta al estado del pedido
- **Picking dinámico premium** — cuando el pedido está en "Armando Pedido" el acordeón cambia a modo surtido:
  - **Progress bar visual** que se llena en tiempo real conforme se surten artículos
  - **Filas clickeables completas** — no solo el checkbox, toda la fila es interactiva
  - **Artículos surtidos se mueven al final** — los pendientes siempre quedan arriba para facilitar el surtido
  - Checkboxes táctiles grandes por artículo, iniciando en pendiente por surtir
  - Estados visuales claros por fila: pendiente (ámbar) vs surtido (verde), sin tachado durante picking
  - Al dejar sin marcar un artículo: se toma como faltante y se actualiza `activo = false` para reflejar agotado en catálogo público en tiempo real
  - Al volver a marcar: restaura `activo = true`
  - Panel de totales dinámico con total original, descuento por faltantes y nuevo total
  - Badge del encabezado muestra `entregados/total` cuando hay faltantes
  - Botón **"Pasar a Listo"** que en un solo `UPDATE` a Supabase: cambia el estado, guarda el total ajustado, persiste `encontrado: true/false` por artículo en `detalles_json`, y abre WhatsApp con mensaje detallado automáticamente
- **Master-detail desktop** — panel izquierdo con pedidos agrupados por estado (sticky headers, avatar con iniciales, timestamp relativo), panel derecho con detalle completo del pedido seleccionado
- **Tarjetas de pedido mobile** — iconos Lucide (Phone, Truck, Store, MapPin) en lugar de emojis, dropdown de estado custom, WhatsApp como CTA principal
- **Vista "Listo para Entrega"**: los artículos no entregados se muestran con imagen en escala de grises, nombre y precio tachados, y el panel de descuento visible para referencia
- **Trazabilidad de descuentos**: si hubo mayoreo, el admin ve precio base tachado, precio aplicado y ahorro por línea
- **Notificación al cliente por WhatsApp** — sincronizada entre sesiones via `notificado_estado` en Supabase:
  - Se desactiva ("✓ Cliente notificado") tras enviarlo en todas las sesiones simultáneamente
  - Se reactiva al cambiar el estado del pedido
  - Al usar "Pasar a Listo" desde picking, el botón queda desactivado automáticamente ya que el mensaje se envía en el mismo acto

### Gestión de catálogo (`/#/admin/catalogo`)

- **Alta de productos** con formulario compacto en dos columnas (core data + details/media) para capturar más rápido sin scroll interno en pantallas estándar
- **Carga de imagen dual**: por archivo (JPG/PNG/GIF/WEBP/AVIF) o por URL externa, con vista previa local inmediata
- **Precios por mayoreo** en formulario y edición: filas dinámicas por etiqueta/cantidad mínima/precio por pieza
- **Gestión de Inventario**: control por unidades o stock ilimitado interactivo directamente desde el formulario
- **Inventario administrable y visual** con búsqueda por nombre, marca, tamaño o categoría
- **Indicadores de nivel de stock**: distintivo visual con símbolo (∞) esmeralda para stock ilimitado y etiquetas con alerta roja vibrante cuando se alcanza el stock bajo
- **Toggle de disponibilidad** por producto (actualiza `activo` en tiempo real)
- **Edición completa** en modal (nombre, descripción, precio, categoría, marca, tamaño, stock, imagen y disponibilidad)
- **Tabs tipo segmented control** — estilo pill en lugar de underline tabs
- **Toggle unificado** — componente `Toggle` reutilizable con soporte `role="switch"`, aria-checked y focus-visible
- **Eliminación de productos** con modal de confirmación estilizado (no nativo del navegador)

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
- Banner de **"Nueva versión disponible"** para actualizar sin desinstalar la app

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

## ♿ Accesibilidad

- **Skip link** "Saltar al contenido" visible al navegar con Tab
- **Estructura semántica** — `<main>`, `<nav>`, `<header>` con `aria-label`
- **aria-live="polite"** en contenedor de pedidos para anunciar cambios en realtime
- **aria-expanded** en acordeones, **aria-current="page"** en nav activa
- **role="status"** en contadores de pedidos
- **focus-visible ring** uniforme en todos los elementos interactivos
- **Contraste WCAG** — `ink.400` ajustado a `#7c4dc8` para cumplir ratio 4.5:1 sobre blanco
- **Toggle accesible** — `role="switch"` + `aria-checked` + soporte teclado

---

## 🔗 Referencias

- [Supabase Dashboard](https://supabase.com)
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev)
- [lucide-react](https://lucide.dev)
