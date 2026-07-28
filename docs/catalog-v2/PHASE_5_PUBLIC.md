# Fase 5 - Catálogo público V2

## Primera entrega

La ruta `/catalogo` ya monta la interfaz pública V2 y consume exclusivamente
los contratos normalizados del catálogo:

- Inicio responsive con categorías principales y colecciones vigentes.
- Navegación jerárquica con URLs como
  `/catalogo/globos/globos-latex`.
- Subcategorías visibles al entrar en una familia.
- Tarjetas agrupadas por producto o gama mediante `catalog_list_cards`.
- Búsqueda, orden, colecciones y facetas server-side persistidas en la URL.
- Filtros de marca, gama, familia de color, color exacto, medida y existencia.
- Favoritos locales y estados de carga, vacío y error.
- Detalle compartible mediante `?producto=slug&gama=slug`.
- Selección progresiva de gama, color, medida y presentación.
- Cálculo local centralizado de precio, contenido y siguiente escalón.
- Tabla de precios por cantidad.
- Shell específico para escritorio y móvil, incluyendo navegación inferior y
  hoja de filtros.
- Metadatos SEO para rutas jerárquicas.

## Contratos utilizados

- `catalog_list_cards`
- `catalog_get_facets`
- `catalog_get_product_detail`
- `catalog_categories`
- `catalog_collections`

No fue necesario modificar el esquema remoto en esta entrega.

## Validación

Se verificaron manualmente contra Supabase:

1. Catálogo completo con 7 grupos publicados.
2. Familia `Globos` con 4 grupos.
3. Subcategoría `Globos de látex` con 4 grupos.
4. Filtro de gama Pastel con 1 grupo y restauración desde URL.
5. Detalle de `Globo látex Glomex`, selección de color Rosa pastel y
   presentaciones bolsa/caja.
6. Precio base de bolsa, siguiente escalón y tabla de mayoreo.
7. Layout de escritorio y viewport móvil de 390 por 844 píxeles.
8. Consola del navegador sin errores ni advertencias.

## Límite intencional

El botón de carrito permanece deshabilitado con una nota visible. La selección
y los precios ya son V2, pero conectar temporalmente el carrito V1 volvería a
introducir identificadores y reglas comerciales incompatibles.

La Fase 6 debe completar:

- Carrito V2 con `variant_id` y `sale_presentation_id`.
- Validación canónica mediante `catalog_validate_cart`.
- Creación de pedido e integración con WhatsApp.
- Migración de favoritos e historial si se decide persistirlos.
- Reemplazo de las pruebas E2E públicas que todavía describen el flujo V1.
