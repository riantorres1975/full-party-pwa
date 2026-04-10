# 🎉 Catálogo Digital PWA — Full Party Uruapan

Catálogo digital para tienda de artículos de fiesta, construido como Progressive Web App (PWA) con React + Vite + Tailwind CSS y conectado a Supabase como backend en la nube.

> **Auditoría Admin (Abril 2026):** 9.8 / 10 promedio — Gestión de Datos 10/10 · Seguridad 10/10 · Formularios 9/10 · Rendimiento 10/10 · Accesibilidad 10/10

---

## 🛠️ Stack tecnológico

| Tecnología | Versión | Uso |
|---|---|---|
| React | 18.3 | UI y manejo de estado |
| Vite | 7.3 | Bundler y dev server |
| Tailwind CSS | 3.4 | Estilos utilitarios |
| Supabase JS | 2.98 | Base de datos, Auth y Realtime |
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
├── supabase_rate_limit.sql        ← Rate limiting server-side + validación en BD
├── vercel.json                    ← Headers de seguridad (CSP, HSTS, X-Frame-Options)
│
├── .github/
│   └── workflows/
│       └── security.yml           ← CI: npm audit + build + security tests (push + semanal)
│
└── src/
    ├── main.jsx                   ← entry point + registro del Service Worker
    ├── AppRouter.jsx              ← enrutador por hash (/ y /#/admin)
    ├── App.jsx                    ← catálogo público principal
    ├── index.css                  ← estilos globales, fuentes y animaciones
    │
    ├── lib/
    │   ├── supabase.js            ← cliente singleton de Supabase
    │   ├── supabaseGuard.js       ← guardedQuery + throwIfSessionError (sesión expirada → signOut + redirect)
    │   └── configAdmin.js         ← getConfig / setConfig para tabla configuracion (anuncios, ajustes)
    │
    ├── data/
    │   └── productos.js           ← ✏️ configuración del negocio + listas de filtros
    │
    ├── hooks/
    │   ├── useAuth.js             ← sesión de Supabase Auth (login/logout)
    │   ├── useCarrito.js          ← carrito con persistencia en localStorage + total dinámico mayoreo + sincronización RT de stock
    │   ├── useConfirm.js          ← hook para modal de confirmación (promesa)
    │   ├── useDebounce.js         ← debounce genérico (default 300 ms) para inputs de búsqueda
    │   ├── useInfiniteScroll.js   ← IntersectionObserver para carga progresiva
    │   ├── usePedido.js           ← insert y búsqueda de pedidos (guarda precio aplicado por línea)
    │   ├── usePedidosAdmin.js     ← estado completo del panel de pedidos (fetch, realtime, filtros, acciones)
    │   ├── useProductForm.js      ← hook compartido crear/editar producto (estado, validación, payload, imagen)
    │   ├── useProductos.js        ← fetch + suscripción Realtime de productos desde Supabase
    │   ├── useAnuncio.js          ← hook público para leer anuncio activo desde configuracion
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
# Opcional: lista blanca de emails admin (RBAC). Si se omite, cualquier cuenta autenticada puede entrar.
VITE_ADMIN_EMAILS="admin@tudominio.com,otro@tudominio.com"
```

Las credenciales están en **Supabase Dashboard → Settings → API**.

### 3. Crear las tablas en Supabase

Ejecuta los scripts en **Supabase → SQL Editor**:

```text
1. supabase_setup.sql       → Tablas, índices y políticas RLS.
2. supabase_rate_limit.sql  → Rate limiting server-side + validaciones en BD (opcional pero recomendado).
```

> **IMPORTANTE:** Lee el final del archivo `supabase_setup.sql` para el paso manual de asignar tu propio UUID a la tabla segura `public.admins`, lo cual te habilitará para leer pedidos completos y editar el catálogo.

### 4. Habilitar Realtime

En **Supabase → Database → Replication** activa el toggle de las tablas `pedidos` y `productos`.  
O con SQL:

```sql
ALTER PUBLICATION supabase_realtime ADD TABLE public.pedidos;
ALTER PUBLICATION supabase_realtime ADD TABLE public.productos;
```

> **`productos`** es necesario para que los clientes vean cambios de stock y disponibilidad al instante cuando el admin modifica el catálogo.

### 5. Crear el usuario administrador

En **Supabase → Authentication → Users → Add user**, crea el usuario con email y contraseña que usarás para entrar al panel de admin.

### 6. Arrancar el servidor

```bash
npm run dev
# http://localhost:3000
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
| `es_nuevo` | BOOLEAN | — | Badge "NUEVO" en las tarjetas del catálogo |
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
- **Sincronización Realtime de productos** — cambios de stock, precio o disponibilidad hechos desde el panel admin se reflejan al instante en el catálogo sin recargar (vía `postgres_changes` INSERT/UPDATE/DELETE)
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
- **Detección de agotados en tiempo real** — si el admin desactiva un producto o reduce el stock a 0 mientras el cliente tiene items en el carrito, aparece un badge "Agotado" rojo, se bloquean los botones +/- y se impide confirmar el pedido hasta retirar los items agotados
- **Ajuste automático de cantidad** — si el admin reduce el stock por debajo de la cantidad en carrito, el carrito ajusta automáticamente al máximo disponible
- **Formato automático de nombre** — capitaliza la primera letra de cada palabra respetando acentos (`León`, `Pérez`)
- **Limpieza de teléfono** — elimina espacios del autocompletado del celular antes de enviar
- **Precios escalonados por mayoreo** — cálculo automático por cantidad en carrito con `obtenerPrecioAplicable(...)`
- **UI de descuento por volumen** en carrito — precio base tachado + precio aplicado resaltado por artículo
- **Mensaje de WhatsApp formateado** — incluye precio aplicado y subtotal correcto por línea
- **Botón deshabilitado** mientras el pedido se guarda en Supabase (spinner de carga)

### Sistema de pedidos y rastreo

- **Banner de anuncio animado** — el admin puede escribir un mensaje corto desde el catálogo y activarlo/desactivarlo; aparece como barra llamativa con gradiente shimmer (naranja→rosa→morado), animación slide-down, glow pulsante y emoji con bounce. El cliente puede cerrarlo por sesión

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
- **RBAC por email** — lista blanca de administradores via `VITE_ADMIN_EMAILS`; si el email del usuario no está en la lista se muestra pantalla de «Acceso denegado» con botón de cierre de sesión
- **Guard de sesión automático** — `guardedQuery` / `throwIfSessionError` detectan JWT expirado en cualquier query de Supabase, ejecutan `signOut()` y redirigen al login sin intervención manual
- **Debounce en búsquedas** — 300 ms de retardo en los campos de búsqueda de pedidos y catálogo, eliminando llamadas innecesarias en cada pulsación
- **Paginación server-side en catálogo** — carga bloques de 100 productos con `.range()` y botón «Cargar más»; evita traer todo el inventario a memoria
- **Code splitting automático** — `AdminPedidos` y `AdminCatalogo` se cargan via `React.lazy` + `Suspense`; el bundle inicial es un 36 % más ligero
- **Validación inline en formularios** — mensajes de error en tiempo real al salir de cada campo (onBlur) para nombre, precio, stock y categoría nueva
- **Límite de imagen 5 MB** — `validateAndSetFile()` rechaza archivos pesados con mensaje de error antes de intentar subir
- **Navegación por teclado en dropdowns** — `SelectCategoria` responde a ↑ ↓ Home End Enter Escape con indicador visual de foco; cumple WAI-ARIA Listbox Pattern
- **Cancelación de pedidos** — botón compacto integrado junto a "Notificar al cliente" en la misma fila (desktop) o botón completo inferior (mobile):
  - Confirmación antes de cancelar (window.confirm)
  - Cambia el estado a `Cancelado` en Supabase y notifica al cliente via WhatsApp con mensaje de cancelación
  - **Restauración automática de stock** — si el pedido ya estaba en "Listo para Entrega" (stock descontado), al cancelar se suma de vuelta la cantidad de cada artículo al `stock_actual` y se reactiva el producto
  - La tarjeta pasa a modo solo-lectura: badge "Cancelado", indicador "Pedido cancelado" y "✓ Cliente notificado"
  - Contador "Cancelado" visible en los counter cards y sidebar stats
  - El rastreo público muestra una pantalla especial "❌ Pedido Cancelado" cuando el cliente busca su folio
  - El constraint de Supabase `pedidos_estado_check` debe incluir `'Cancelado'` (SQL: `ALTER TABLE pedidos DROP CONSTRAINT pedidos_estado_check; ALTER TABLE pedidos ADD CONSTRAINT pedidos_estado_check CHECK (estado IN ('Por Surtir', 'Armando Pedido', 'Listo para Entrega', 'Cancelado'));`)

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
- **Filtro "Nuevos"** — pill verde que filtra productos marcados como `es_nuevo = true`, junto a Todos y Stock Bajo
- **Stock aditivo** — al editar un producto, el campo de stock muestra la cantidad actual como solo lectura y un campo separado "Agregar al stock (+)" que suma a lo existente en lugar de reemplazarlo
- **Gestión de categorías** — botón "Categorías" en la toolbar abre un modal con lista completa, renombrar inline y eliminar con confirmación
- **Gestión de marcas** — botón "Marcas" (azul) para renombrar o eliminar marcas en cascada sobre todos los productos
- **Gestión de tamaños** — botón "Tamaños" (verde) con la misma funcionalidad de rename/delete
- **Editor de anuncio** — botón "Anuncio" (ámbar) en la toolbar despliega un editor inline con textarea (máx 200 chars), toggle activo/inactivo y guardado directo a la tabla `configuracion`

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
- **Auto-update transparente** — el SW ya no cachea `index.html` (siempre pide al servidor); al detectar una nueva versión, se activa automáticamente sin intervención del usuario
- **Detección de chunks faltantes** — si tras un deploy los JS viejos ya no existen, el SW envía `FORCE_RELOAD` a todas las pestañas abiertas para que recarguen
- **Polling cada 5 minutos** — chequea actualizaciones del SW periódicamente en segundo plano

---

## 🗺️ Rutas

| URL | Vista | Protección |
|---|---|---|
| `/` | Catálogo público | — |
| `/#/admin` | Panel de administración (Pedidos) | Requiere sesión activa de Supabase Auth |
| `/#/admin/catalogo` | Gestión de catálogo | Requiere sesión activa de Supabase Auth |

> **RBAC opcional:** si defines `VITE_ADMIN_EMAILS` en tu `.env`, solo esas cuentas pueden acceder al panel aunque estén autenticadas. Si la variable está vacía o ausente, cualquier cuenta autenticada tiene acceso (comportamiento clásico).

### Tabla `configuracion`

| Campo | Tipo | Notas |
|---|---|---|
| `clave` | TEXT | PK — identificador único (ej: `anuncio`) |
| `valor` | JSONB | Valor almacenado como objeto JSON |

> Lectura pública. Solo admins pueden insertar/actualizar. Se usa para el sistema de anuncios y futuros ajustes de la tienda.

Enrutamiento por **hash** (`window.location.hash`) sin react-router — compatible con cualquier hosting estático sin configuración adicional.

---

## 🌐 Deploy en producción

```bash
npm run build   # genera la carpeta /dist lista para subir
```

Sube la carpeta `/dist` a **Vercel** y agrega las variables de entorno (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_ADMIN_EMAILS`) en la configuración del hosting.

El archivo `vercel.json` incluido configura automáticamente los headers de seguridad (CSP, HSTS, X-Frame-Options, etc.).

> En Netlify agrega un archivo `public/_redirects` con el contenido `/* /index.html 200` para que la navegación funcione correctamente al recargar.

---

## 📋 Scripts disponibles

```bash
npm run dev      # servidor de desarrollo → http://localhost:3000
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
- **`prefers-reduced-motion`** — media query CSS global que desactiva todas las animaciones y transiciones para usuarios con sensibilidad al movimiento
- **Navegación por teclado en `SelectCategoria`** — ↑ ↓ Home End Enter Escape con `data-[focused]` outline visible y `role="listbox"` / `role="option"` / `aria-selected`

---

## 🔒 Seguridad

### Auditoría (Abril 2026)

Se realizó una auditoría de seguridad completa del proyecto con las siguientes mejoras implementadas:

#### Headers de seguridad (`vercel.json`)

| Header | Valor |
|---|---|
| Content-Security-Policy | Restrictivo: solo `self`, Supabase y Google Fonts |
| Strict-Transport-Security | 2 años con preload |
| X-Frame-Options | DENY (anti-clickjacking) |
| X-Content-Type-Options | nosniff |
| Referrer-Policy | strict-origin-when-cross-origin |
| Permissions-Policy | camera, microphone deshabilitados |

#### Protecciones implementadas

- **Row Level Security (RLS)** — control de acceso a nivel de base de datos
- **RBAC por email** — lista blanca de administradores via `VITE_ADMIN_EMAILS`
- **Rate limiting dual** — client-side (5 pedidos/30min) + server-side (trigger en BD)
- **Validación de inputs** — límites de longitud en nombre (100), dirección (300), items (50)
- **Honeypot anti-bot** — campo invisible con atributos atractivos para crawlers
- **Validación de teléfono** — 190+ ladas mexicanas reales (IFT)
- **Upload seguro** — validación de MIME type, extensión, tamaño (5 MB) y magic bytes
- **Sanitización de errores** — mensajes genéricos al usuario, detalles solo en console
- **Session guard** — auto-logout en JWT expirado con detección robusta
- **Service Worker seguro** — sin inline scripts, fallback offline CSP-compatible
- **Cache seguro** — `sw.js` con `no-cache`, assets con `immutable`
- **MFA habilitado** — autenticación de dos factores para cuentas admin
- **52 tests de seguridad** — suite automatizada que valida todas las defensas
- **CI/CD con auditoría** — GitHub Actions ejecuta `npm audit` + build + tests en cada push

#### Rate limiting server-side (`supabase_rate_limit.sql`)

Trigger en PostgreSQL que valida antes de cada INSERT en `pedidos`:
- Máximo 10 pedidos por teléfono en 30 minutos
- Longitud máxima de nombre, dirección y teléfono
- Total no negativo
- Al menos 1 producto, máximo 50 por pedido

---

## 🔗 Referencias

- [Supabase Dashboard](https://supabase.com)
- [Supabase JS Docs](https://supabase.com/docs/reference/javascript)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vite Docs](https://vitejs.dev)
- [lucide-react](https://lucide.dev)
