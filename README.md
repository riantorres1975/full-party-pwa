# Catálogo Digital — Full Party Uruapan

PWA para tienda de artículos de fiesta. El cliente navega el catálogo, arma su pedido y lo envía por WhatsApp. El admin gestiona pedidos y catálogo desde un panel protegido.

---

## Stack

| Tecnología | Versión | Para qué se usa |
|---|---|---|
| React | 18.3 | UI y estado |
| Vite | 7.3 | Bundler y dev server |
| Tailwind CSS | 3.4 | Estilos |
| Supabase JS | 2.98 | Base de datos, Auth y Realtime |
| Fuse.js | 7.3 | Búsqueda fuzzy en catálogo y panel admin |
| lucide-react | latest | Íconos |
| React Router DOM | 7 | Routing BrowserRouter (pathname) |
| Service Worker | — | PWA, cache offline |

---

## Estructura del proyecto

```
├── .env                        ← credenciales (no subir a git)
├── .env.example                ← plantilla
├── vercel.json                 ← headers de seguridad
├── supabase_setup.sql          ← tablas, RLS y políticas
├── supabase_rate_limit.sql     ← rate limiting en BD (opcional)
│
├── public/
│   ├── manifest.json           ← config PWA
│   └── sw.js                   ← Service Worker
│
└── src/
    ├── main.jsx                ← entry point + registro SW
    ├── AppRouter.jsx           ← BrowserRouter + Routes + meta SEO
    ├── App.jsx                 ← catálogo público
    │
    ├── lib/
    │   ├── supabase.js         ← cliente singleton
    │   ├── supabaseGuard.js    ← manejo de sesión expirada
    │   ├── configAdmin.js      ← lectura/escritura de configuracion
    │   ├── permissions.js      ← definición de permisos por recurso
    │   ├── roles.js            ← roles disponibles (owner, admin, staff…)
    │   └── estadoMeta.js       ← colores y etiquetas de estado de pedido
    │
    ├── data/
    │   └── articulos.js        ← categorías, marcas, tamaños y moneda
    │
    ├── contexts/
    │   ├── AdminDataContext.jsx ← datos compartidos del panel admin
    │   ├── BreadcrumbContext.jsx← breadcrumb global
    │   └── PermissionsContext.jsx← rol y permisos del usuario activo
    │
    ├── hooks/
    │   ├── useAuth.js          ← login/logout
    │   ├── useCarrito.js       ← carrito con localStorage y mayoreo
    │   ├── useLanguage.jsx     ← i18n ES/EN
    │   ├── usePermission.js    ← can(action, resource) basado en PermissionsContext
    │   ├── useConfirm.js       ← modal de confirmación
    │   ├── useDebounce.js      ← debounce para búsquedas
    │   ├── useInfiniteScroll.js← carga progresiva
    │   ├── usePedido.js        ← crear y buscar pedidos
    │   ├── useProductos.js     ← productos con Realtime
    │   ├── useAnuncio.js       ← leer anuncio activo
    │   ├── useTheme.js         ← dark/light mode
    │   └── usePWA.js           ← prompt de instalación
    │
    ├── utils/
    │   ├── fuzzySearch.js       ← búsqueda fuzzy reutilizable con Fuse.js
    │   ├── precios.js          ← precio por mayoreo
    │   ├── validarTelefono.js  ← ladas mexicanas (IFT)
    │   ├── whatsapp.js         ← genera mensaje de WhatsApp
    │   ├── formatters.js       ← formato de moneda, fecha, etc.
    │   ├── imagenes.js         ← optimización de imágenes en cliente
    │   └── normalizar.js       ← normalización de nombres a Title Case
    │
    ├── layouts/
    │   └── admin/
    │       ├── SidebarItem.jsx
    │       ├── SidebarSection.jsx
    │       ├── Topbar.jsx
    │       └── UserMenu.jsx
    │
    ├── pages/
    │   ├── LandingPage.jsx
    │   ├── Sucursales.jsx
    │   ├── ComoFunciona.jsx
    │   ├── Destacados.jsx
    │   ├── Blog.jsx
    │   ├── BlogArticulo.jsx
    │   └── admin/
    │       ├── PedidosPage.jsx
    │       ├── CatalogoPage.jsx
    │       ├── dashboard/      ← KPIs, gráficas, top productos
    │       ├── pedidos/        ← Kanban, historial, picking, modal detalle
    │       ├── clientes/       ← tabla, drawer de historial, edición inline
    │       ├── inventario/     ← control de stock en tiempo real
    │       ├── usuarios/       ← gestión de roles e invitaciones
    │       ├── reportes/       ← analítica anual de ventas
    │       ├── tienda/         ← configuración de datos de la tienda
    │       ├── pagos/          ← flujo de confirmación de pagos
    │       └── registro/       ← página pública de registro por token
    │
    └── components/
        ├── Header.jsx
        ├── LanguageToggle.jsx
        ├── ThemeToggle.jsx
        ├── BuscadorFiltros.jsx
        ├── SidebarFiltrosDesktop.jsx
        ├── ModalFiltros.jsx
        ├── ProductGrid.jsx
        ├── ProductCard.jsx
        ├── OptimizedImage.jsx
        ├── ProductosSkeleton.jsx
        ├── FloatingCartButton.jsx
        ├── CarritoDrawer.jsx
        ├── ProductoDetalleModal.jsx
        ├── RastreoPedido.jsx
        ├── RedesSociales.jsx
        ├── LoginAdmin.jsx
        ├── AdminCatalogo.jsx
        ├── SiteLayout.jsx
        ├── admin/              ← PageHeader, StatsCard, EmptyState, RoleBadge, DataTable
        ├── auth/               ← ProtectedRoute, Can (componente de permisos)
        └── ui/
            ├── Toggle.jsx
            ├── ToastProvider.jsx
            ├── ConfirmModal.jsx
            ├── Skeleton.jsx
            └── BottomNav.jsx
```

---

## Instalación

### 1. Instalar dependencias

```bash
npm install
```

### 2. Variables de entorno

Copia `.env.example` como `.env`:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
VITE_WHATSAPP_NUMBER=521XXXXXXXXXX
VITE_NOMBRE_NEGOCIO=Tu Negocio
VITE_HORARIO_TIENDA=Lun–Sáb 9am–7pm
VITE_MONEDA=MXN
VITE_ADMIN_EMAILS=admin@tudominio.com,otro@tudominio.com

# Sucursal 1
VITE_SUC1_NOMBRE=Nombre de la calle/colonia
VITE_SUC1_BADGE=Sucursal Principal
VITE_SUC1_DIRECCION=Tu dirección completa
VITE_SUC1_MAPS_URL=https://maps.app.goo.gl/...
VITE_SUC1_FACEBOOK=https://www.facebook.com/...

# Sucursal 2
VITE_SUC2_NOMBRE=Nombre de la calle/colonia
VITE_SUC2_BADGE=Sucursal Norte
VITE_SUC2_DIRECCION=Tu dirección completa
VITE_SUC2_MAPS_URL=https://maps.app.goo.gl/...
VITE_SUC2_FACEBOOK=https://www.facebook.com/...

# Redes sociales
VITE_TIKTOK_URL=https://www.tiktok.com/@tunegocio
```

Las credenciales de Supabase están en **Dashboard → Settings → API**.

`VITE_ADMIN_EMAILS` es opcional — si se omite, cualquier cuenta autenticada puede entrar al admin.

### 3. Crear tablas en Supabase

Ejecuta en **Supabase → SQL Editor**:

1. `supabase_setup.sql` — tablas, índices y políticas RLS
2. `supabase_rate_limit.sql` — rate limiting en BD (opcional pero recomendado)

Al final de `supabase_setup.sql` hay un paso manual: insertar tu UUID en `public.admins` para darte acceso como administrador.

### 4. Habilitar Realtime

En **Supabase → Database → Replication** activa `pedidos` y `productos`, o con SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
```

### 5. Crear usuario administrador

En **Supabase → Authentication → Users → Add user**, crea el usuario con el email que configuraste en `VITE_ADMIN_EMAILS`.

### 6. Arrancar

```bash
npm run dev
# http://localhost:3000
```

---

## Personalización

El nombre del negocio y el teléfono van en `.env`. Las categorías, marcas y tamaños se configuran en `src/data/productos.js`:

```js
export const categorias = [
  { id: 'globos',       label: '🎈 Globos'         },
  { id: 'globos-metal', label: '✨ Globos Metálicos' },
  { id: 'pinatas',      label: '🪅 Piñatas'         },
];
```

---

## Base de datos

### `productos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK auto |
| `nombre` | TEXT | Requerido |
| `precio` | NUMERIC(10,2) | Requerido |
| `descripcion` | TEXT | — |
| `imagen_url` | TEXT | URL externa o bucket de Supabase |
| `categoria` | TEXT | Debe coincidir con `categorias` en productos.js |
| `marca` | TEXT | — |
| `tamano` | TEXT | — |
| `activo` | BOOLEAN | `false` = aparece como Agotado |
| `stock_ilimitado` | BOOLEAN | Si es `true` ignora validación de cantidad |
| `stock_actual` | NUMERIC | Unidades disponibles |
| `stock_minimo` | NUMERIC | Umbral para alerta de Stock Bajo |
| `precios_mayoreo` | JSONB | Escalas: `[{ etiqueta, cantidad_minima, precio }]` |
| `es_nuevo` | BOOLEAN | Muestra badge "NUEVO" en la tarjeta |
| `created_at` | TIMESTAMPTZ | Auto |

### `pedidos`

| Campo | Tipo | Notas |
|---|---|---|
| `id` | UUID | PK auto |
| `folio` | TEXT UNIQUE | Generado por SQL: `FP-XXXX` |
| `cliente_nombre` | TEXT | — |
| `cliente_telefono` | TEXT | 10 dígitos |
| `tipo_entrega` | TEXT | `tienda` o `envio` |
| `direccion` | TEXT | Solo para envío a domicilio |
| `total` | NUMERIC | Total en MXN |
| `estado` | TEXT | Ver tabla de estados |
| `detalles_json` | JSONB | Snapshot del carrito con precio aplicado por línea |
| `notificado_estado` | TEXT | Último estado notificado al cliente (sincronizado por Realtime) |
| `fecha_envio` | TIMESTAMPTZ | Fecha real de cierre cuando el pedido pasa a `Enviado` |
| `fecha_cancelado` | TIMESTAMPTZ | Fecha real de cierre cuando el pedido pasa a `Cancelado` |
| `created_at` | TIMESTAMPTZ | Auto |
| `updated_at` | TIMESTAMPTZ | Auto via trigger |

**Estados del pedido:**

| Estado | Color | Significado |
|---|---|---|
| `Por Surtir` | Rojo | Pedido recién recibido |
| `Armando Pedido` | Amarillo | En preparación / picking |
| `Listo para Entrega` | Verde | Listo para recoger o enviar |
| `Enviado` | Azul | Salió de la tienda, en camino al cliente |
| `Cancelado` | Gris | Cancelado por el admin |

> **Nota:** si agregas el estado `Enviado` a una base de datos existente, ejecuta en Supabase SQL Editor:
> ```sql
> ALTER TABLE public.pedidos DROP CONSTRAINT pedidos_estado_check;
> ALTER TABLE public.pedidos ADD CONSTRAINT pedidos_estado_check
>   CHECK (estado IN ('Por Surtir','Armando Pedido','Listo para Entrega','Enviado','Cancelado'));
> ```

> **Nota:** para bases existentes se recomienda agregar también las columnas de fecha estable para historial:
> ```sql
> ALTER TABLE public.pedidos
>   ADD COLUMN IF NOT EXISTS fecha_envio TIMESTAMPTZ,
>   ADD COLUMN IF NOT EXISTS fecha_cancelado TIMESTAMPTZ;
> ```

### `configuracion`

| Campo | Tipo | Notas |
|---|---|---|
| `clave` | TEXT | PK — ej: `anuncio` |
| `valor` | JSONB | Contenido del ajuste |

Lectura pública. Solo admins pueden escribir. Se usa para el sistema de anuncios.

---

## Funcionalidades

### Landing Page

- Hero con animación typewriter que alterna entre sucursales con efecto fiesta (partículas + rebote)
- Sección de beneficios mayoreo, pasos de compra y categorías destacadas
- Galería de decoraciones de clientes con animación flotante, zoom e iluminación al hover
- Carrusel de reseñas reales de Google Maps con navegación automática y manual
- Tarjetas de sucursales con ilustración SVG, link a Google Maps y botón de Facebook
- Sección FAQ con acordeón accesible
- Botones de redes sociales (WhatsApp, Facebook ×2, TikTok) en header y footer
- Schema.org `LocalBusiness` + `FAQPage` para SEO
- Lighthouse: **Performance 93 · Accessibility 100 · Best Practices 100 · SEO 100**

### Catálogo público

- Grid responsivo: 1 columna en móvil, hasta 6 en desktop con sidebar de filtros
- Dark mode desde el header
- Búsqueda fuzzy en tiempo real por nombre, descripción, categoría, marca y tamaño con tolerancia a errores y acentos
- Filtros por categoría, marca y tamaño (AND entre dimensiones, OR dentro de cada una)
- Infinite scroll adaptativo — móvil inicia con 4 y agrega 6; desktop inicia con 12 y agrega 12
- Imágenes optimizadas con lazy loading y fallback robusto (si falta URL o falla la carga)
- Productos agotados en escala de grises con botón deshabilitado
- Cambios del admin (precio, stock, disponibilidad) se reflejan en el catálogo sin recargar, vía Realtime
- Modal de detalle: bottom sheet en móvil, side-by-side en desktop
- Banner de anuncio configurable desde el admin (gradiente animado, el cliente puede cerrarlo por sesión)
- Render inicial acelerado con caché local de productos + revalidación en segundo plano

### Carrito y checkout

- Carrito persistido en localStorage
- Toggle entre recoger en tienda y envío a domicilio
- Precios por mayoreo calculados automáticamente según cantidad
- Validación de nombre (requerido, capitalización automática) y teléfono (ladas mexicanas reales)
- Si el admin agota un producto mientras está en el carrito: aparece badge rojo y se bloquea el checkout
- Si el admin reduce el stock por debajo de la cantidad en carrito: se ajusta automáticamente
- Honeypot anti-bot y rate limit de 5 pedidos por sesión cada 30 minutos
- Al confirmar, el pedido se guarda en Supabase y se genera el folio antes de abrir WhatsApp
- Si Supabase falla, WhatsApp se abre igual sin folio (degradación elegante)

### Rastreo de pedidos

El cliente ingresa su folio y ve un stepper animado de 4 pasos: Por Surtir → Armando Pedido → Listo para Entrega → Enviado. La barra de progreso se colorea proporcionalmente. Si el pedido está cancelado muestra una pantalla especial. La búsqueda está restringida solo a folio por privacidad.

### Panel de administración (`/admin`)

**Layout:**
- Desktop: sidebar colapsable con avatar, nav con badges y secciones, toggle de tema
- Móvil: bottom navigation con tabs (Pedidos, Catálogo, Cuenta)
- Panel bilingüe ES/EN
- Breadcrumb dinámico por página

**Roles y permisos (RBAC):**
- Roles definidos en `src/lib/roles.js`: `owner`, `admin`, `staff`, etc.
- Permisos granulares en `src/lib/permissions.js` por recurso y acción
- `PermissionsContext` carga el rol real desde la tabla `profiles` en Supabase
- Hook `usePermission(action, resource)` y componente `<Can>` para control declarativo
- `<ProtectedRoute>` redirige si falta sesión o permiso

**Pedidos:**
- Lista en tiempo real vía Realtime (nuevos pedidos aparecen solos, actualizaciones se propagan a todas las sesiones)
- Buscador fuzzy por folio, nombre, teléfono, estado o método de pago
- Vista separada en tabs **Activos** e **Historial**
- **Activos (Kanban):** 3 columnas (Por Surtir · Armando Pedido · Listo para Entrega)
- **Historial (DataTable):** estados Enviado/Cancelado con filtros, rango de fecha y export CSV
- Click en cualquier card abre modal con el detalle completo del pedido
- Cambio de estado con actualización optimista
- Notificación al cliente por WhatsApp sincronizada entre sesiones (se desactiva tras enviar, se reactiva al cambiar estado)
- Mensaje de WhatsApp adaptado según tipo de entrega (envío a domicilio vs recoger en tienda)
- Fechas de historial estables con `fecha_envio`/`fecha_cancelado` cuando están disponibles
- Botón **"Copiar datos para repartidor"** en pedidos con envío listos: copia nombre, teléfono, dirección y total al portapapeles

**Picking (modo "Armando Pedido"):**
- **Modo guiado mobile-first:** muestra 1 producto activo a la vez para surtir más rápido
- Auto-avance al siguiente pendiente al confirmar completo, parcial o no surtido
- Feedback inmediato `✓ Guardado` antes del salto de producto
- Reglas de acción por cantidad: solo 1 CTA principal visible por paso (completo/parcial/no surtido)
- Progress bar + texto `Paso X de Y` sin contadores duplicados
- Vista secundaria **"Ver todos los productos"** en formato resumen compacto (escaneable, con estado y subtotal por fila)
- Bloque final con total ajustado por faltantes y CTA principal para cerrar picking
- Al confirmar cierre: cambia estado, guarda total ajustado, persiste cantidades surtidas y abre WhatsApp con detalle

**Cancelación:**
- Requiere confirmación antes de cancelar
- Notifica al cliente por WhatsApp
- Si el pedido ya estaba en "Listo para Entrega", restaura el stock automáticamente
- El pedido pasa al tab Historial con estado "Cancelado"

**Mensajes de WhatsApp por estado:**

| Estado | Contenido |
|---|---|
| Por Surtir | Confirmación de recepción |
| Armando Pedido | Aviso de que está en preparación |
| Listo para Entrega (picking, envío) | Lista de artículos + total + aviso de que saldrá a domicilio |
| Listo para Entrega (picking, tienda) | Lista de artículos + total + invitación a pasar a recoger |
| Listo para Entrega (manual, envío) | Aviso de que saldrá pronto a domicilio |
| Listo para Entrega (manual, tienda) | Aviso de que puede pasar a recoger |
| Enviado | Aviso de que el pedido ya salió de la tienda |
| Cancelado | Notificación de cancelación |

### Gestión de catálogo (`/admin/catalogo`)

- Alta de productos con formulario en dos columnas
- Imagen por archivo (JPG/PNG/GIF/WEBP/AVIF, máx 5 MB) o por URL externa
- Optimización automática antes de subir: resize, compresión y conversión a WebP cuando conviene
- Se conserva transparencia (sin fondo negro en PNG/WebP/AVIF)
- Nombre de archivo SEO-friendly basado en el nombre del producto
- Precios por mayoreo: filas dinámicas por etiqueta/cantidad/precio
- Stock: modo ilimitado o por unidades con campo "agregar al stock" (suma, no reemplaza)
- Toggle de disponibilidad por producto
- Edición completa en modal
- Eliminar producto con confirmación
- Filtros: Todos / Stock Bajo / Nuevos
- Búsqueda fuzzy por nombre, descripción, categoría, marca y tamaño
- Gestión de categorías, marcas y tamaños: renombrar y eliminar en cascada desde modales
- Editor de anuncio: textarea con máx 200 caracteres, toggle activo/inactivo, guarda en tabla `configuracion`

### Dashboard (`/admin/dashboard`)

- KPIs de ingresos, pedidos, ticket promedio y clientes únicos
- Presets de periodo (`Hoy`, `7 días`, `30 días`, `90 días`, `Personalizado`), por defecto `Hoy`
- Gráficas de ventas por día y pedidos por estado
- Módulos de top productos y últimos pedidos con folio real

### Clientes (`/admin/clientes`)

- Tabla agregada por cliente (pedidos, gasto total, último pedido)
- Drawer de detalle con historial de pedidos clickable
- Edición inline de nombre/teléfono (persistida sobre pedidos existentes)
- Método de entrega mostrado desde el pedido más reciente no cancelado

### Inventario (`/admin/inventario`)

- Tabla de stock en tiempo real con actualización optimista
- Columnas: producto, categoría, stock actual, mínimo, estado (OK / Bajo / Agotado)
- Filtros por estado de stock y búsqueda fuzzy por nombre, categoría, marca y tamaño
- Edición inline de stock actual y mínimo por fila
- Layout responsivo: tabla completa en desktop, 3 columnas en móvil
- Sticky headers y filtros al hacer scroll

### Usuarios (`/admin/usuarios`)

- Lista de usuarios con rol, estado y fecha de ingreso
- Invitación por email: genera un token y envía el link de registro
- Bandeja de invitaciones pendientes
- Cambio de rol desde dropdown (owner, admin, staff…)
- Drawer de detalle por usuario con historial de actividad
- Flujo de registro público en `/registro?token=…` con contraseña propia

### Reportes (`/admin/reportes`)

- Analítica anual: ventas mensuales, ranking de productos, clientes frecuentes y tipo de entrega
- Tarjetas de resumen con totales del año seleccionado
- Selector de año para comparar periodos históricos

### Tienda (`/admin/tienda`)

- Configuración de datos de la tienda: nombre, WhatsApp, sucursales, redes sociales
- Cambios persistidos en tabla `configuracion` de Supabase
- Actualización en vivo sin necesidad de redesplegar

### Pagos (`/admin/pagos`)

- Lista de pedidos pendientes de confirmación de pago
- Búsqueda fuzzy en tabla compartida por folio, cliente, teléfono y campos visibles
- Filtros por estado (pendiente / confirmado) y periodo (hoy / semana / mes / todo)
- KPIs: total cobrado, pedidos pendientes, monto pendiente
- Modal de confirmación con detalle del pedido y método de pago
- Registro del método (efectivo, transferencia, tarjeta…)

### PWA

- Instalable en Android e iOS
- Service Worker con Network First — cache como fallback offline
- Al detectar una nueva versión se activa automáticamente
- Si un chunk JS ya no existe en el servidor (nuevo deploy), el SW manda `FORCE_RELOAD` a todas las pestañas
- Revisa actualizaciones del SW cada 5 minutos

### Rendimiento (estado actual)

**Score Lighthouse: 82** · FCP 2.1s · LCP 4.5s · TBT 60ms · CLS 0.001

- Fuentes auto-hospedadas con `font-display: swap` para reducir bloqueos de render
- Catálogo con carga en 2 fases cuando no hay caché: primer lote rápido + lista completa en background
- Caché local de productos (`localStorage`) con TTL y sincronización por Realtime
- Optimización de imágenes en cliente para evitar uploads pesados que degraden LCP
- Code splitting: recharts, lucide-react y módulos admin en chunks separados
- Boot overlay optimizado con delay reducido (200ms) y transiciones rápidas
- useProductos con loading no bloqueante (cache-first strategy)
- Modulepreload para chunks críticos en `index.html`

---

## Rutas

| URL | Vista | Acceso |
|---|---|---|
| `/` | Landing Page pública | Libre |
| `/catalogo` | Catálogo de productos | Libre |
| `/catalogo/:categoria` | Catálogo filtrado por categoría | Libre |
| `/sucursales` | Página de sucursales | Libre |
| `/como-funciona` | Guía de compra | Libre |
| `/destacados` | Categorías destacadas | Libre |
| `/blog` | Blog | Libre |
| `/blog/:slug` | Artículo del blog | Libre |
| `/registro` | Registro por token de invitación | Libre (token requerido) |
| `/admin` | Redirect automático según permisos | Requiere sesión |
| `/admin/dashboard` | KPIs y gráficas | `reportes.view` |
| `/admin/pedidos` | Kanban + historial + picking | Sesión activa |
| `/admin/catalogo` | Gestión de productos | Sesión activa |
| `/admin/clientes` | Tabla de clientes | `clientes.view` |
| `/admin/inventario` | Control de stock en tiempo real | Sesión activa |
| `/admin/usuarios` | Roles e invitaciones | `usuarios.view` |
| `/admin/reportes` | Analítica anual de ventas | `reportes.view` |
| `/admin/tienda` | Configuración de datos de la tienda | `tienda.edit` |
| `/admin/pagos` | Flujo de confirmación de pagos | Sesión activa |

Routing con React Router DOM v7 (BrowserRouter). El archivo `vercel.json` incluye el rewrite SPA necesario para que las rutas funcionen en Vercel.

---

## Deploy

```bash
npm run build   # genera /dist
```

Sube `/dist` a **Vercel** y configura las variables de entorno en el dashboard. El archivo `vercel.json` ya incluye los headers de seguridad y el rewrite SPA para React Router.

Google Analytics 4 está activo con el ID `G-E07C39EMGD` en `index.html`.

Para Netlify agrega `public/_redirects`:
```
/* /index.html 200
```

---

## Scripts

```bash
npm run dev        # desarrollo → http://localhost:3000
npm run build      # producción → /dist
npm run preview    # previsualizar el build
npm run lighthouse # auditoría Lighthouse (requiere build + preview corriendo)
```

---

## Accesibilidad

- Skip link visible al navegar con Tab
- Estructura semántica con `<main>`, `<nav>`, `<header>` y `aria-label`
- `aria-live="polite"` en la lista de pedidos
- `aria-expanded` en acordeones, `aria-current="page"` en nav
- Focus visible en todos los elementos interactivos
- Contraste WCAG AA en todos los colores de texto
- Toggle con `role="switch"` y `aria-checked`
- `prefers-reduced-motion` desactiva animaciones para quienes lo necesiten
- `SelectCategoria` navegable con teclado: ↑ ↓ Home End Enter Escape

---

## Seguridad

**Headers HTTP** (`vercel.json`):

| Header | Configuración |
|---|---|
| Content-Security-Policy | Solo `self`, Supabase y Google Fonts |
| Strict-Transport-Security | 2 años con preload |
| X-Frame-Options | DENY |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | cámara y micrófono deshabilitados |

**Otras protecciones:**

- Row Level Security en todas las tablas
- RBAC por email con `VITE_ADMIN_EMAILS`
- Rate limiting: 5 pedidos/30min en cliente (localStorage) + trigger en BD (10 pedidos/30min por teléfono + anti-duplicados)
- Búsqueda pública de pedidos restringida solo a folio (no expone datos por teléfono)
- Validación de 190+ ladas mexicanas reales
- Honeypot anti-bot en el formulario de pedido
- Subida de imágenes con validación de MIME, extensión, tamaño y magic bytes
- Auto-logout cuando el JWT expira
- Console.log eliminados en build de producción (terser drop_console)

---

## Referencias

- [Supabase Docs](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [Vite](https://vitejs.dev)
- [lucide-react](https://lucide.dev)
