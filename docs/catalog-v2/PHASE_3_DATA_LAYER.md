# Fase 3 - Capa de datos del Catalogo V2

Fecha: 2026-07-27
Rama: `refactor/catalog-v2`

## 1. Estado reconstruido

La sesion anterior dejo:

- Fase 1 cerrada en `86f0042`.
- Fase 2 cerrada en `d56284d`.
- Fase 3 iniciada, pero todos los archivos de `src/services/catalog/` y
  `src/hooks/catalog/` estaban sin seguimiento de Git.
- Cambios adicionales sin commit para idempotencia y total canonico del checkout
  V1 en `CarritoDrawer`, `usePedido` y `pedidosPublicos`.
- Sin pruebas unitarias para la logica pura V2.

`REFACTOR_NOTES.md` corresponde principalmente al refactor anterior del panel
administrativo. El seguimiento especifico del Catalogo V2 esta en
`docs/catalog-v2/`.

## 2. Trabajo completado localmente

### Servicios y repositorios

Se completo `src/services/catalog/` con:

- Adaptadores estables para tarjetas, detalle, facetas, categorias,
  presentaciones y carrito validado.
- Repositorios de categorias, colecciones, productos, variantes,
  presentaciones, precios, inventario, busqueda y pedidos.
- Logica pura de filtros URL, seleccion de variantes, precios y errores.
- Ventanas de colecciones inclusivas durante todo el dia final.
- Una sola suscripcion Realtime compartida por cliente/canal, con multiples
  listeners, en lugar de abrir cinco suscripciones por cada hook.
- Lineas de carrito preservadas sin corregirlas o descartarlas silenciosamente:
  Supabase conserva la responsabilidad de reportar cada linea invalida.

### Hooks

Se completo `src/hooks/catalog/` con:

- `useCatalogCategories`
- `useCatalogCards`
- `useProductDetail`
- `useCatalogFilters`
- `useCatalogSearch`
- `useVariantSelection`
- `usePresentationPricing`
- `useCatalogInventory`

Tambien se agrego `src/hooks/catalog/index.js` como punto de exportacion.

Los hooks de tarjetas y detalle descartan respuestas obsoletas cuando cambian
los filtros o el producto durante una solicitud.

## 3. Errores heredados corregidos

1. `cardRequiresOptions()` leia nombres `snake_case` despues de adaptar la
   tarjeta a `camelCase`. Resultado anterior: todas las tarjetas requerian
   opciones, incluso un producto simple.
2. La RPC solo devolvia tipos de presentacion distintos. Dos presentaciones del
   mismo tipo podian parecer una sola. `catalog_list_cards` ahora devuelve
   `presentation_count`.
3. `getCandidateVariants()` buscaba `selection.line_id`, pero el estado usa
   `selection.lineId`. Resultado anterior: no filtraba ninguna variante.
4. Una seleccion inicial con gama, color y medida perdia los valores
   dependientes durante la normalizacion en cascada.
5. Precios y cantidades mezclaban presentaciones adaptadas en `camelCase` con
   campos crudos en `snake_case`. El precio visible podia quedar en cero.
6. `Number(null)` convertia campos opcionales a cero. Esto afectaba precio de
   comparacion, cantidades contenidas, maximos y disponibilidad desconocida.
7. Un `maximum_order_quantity = null` podia interpretarse como maximo cero.
8. Las colecciones terminaban a las 00:00 del ultimo dia, no al finalizarlo.
9. La validacion del carrito eliminaba IDs faltantes y cambiaba cantidades
   invalidas a `1` antes de llamar al RPC.
10. Cada consumidor Realtime creaba un canal duplicado con cinco listeners.

## 4. Ajuste de contrato SQL

`005_catalog_functions.sql` agrega `presentation_count` a cada tarjeta:

```text
variant_count
presentation_count
```

El boton directo solo se habilita cuando ambos valores son exactamente `1` y
no existen dimensiones multiples.

El harness SQL agrega el caso E3 para la bomba manual simple.

## 5. Pruebas

### JavaScript

Comando:

```bash
npm test
```

Resultado: `132/132 PASS`.

Se agregaron 22 casos V2 para:

- Adaptadores.
- Seleccion de variantes y combinaciones inexistentes.
- Precios normal, mayoreo y contenido total.
- Filtros sincronizados con URL.
- Clasificacion de errores.
- Ventanas temporales de colecciones.

### SQL

Entorno: PostgreSQL 15 y 17 en Docker; validación remota en PostgreSQL 17.6.

Resultado: todos los casos A-L y RLS pasan, incluyendo:

- Mayoreo 11/12/20.
- Caja independiente.
- Presentaciones anidadas.
- Producto simple.
- Variantes inexistentes.
- Carrito canonico.
- Pedido, idempotencia e inventario transaccional.
- Politicas RLS.
- Nuevo conteo real de presentaciones.

### Compilacion

- `npm run build`: PASS.
- Las 24 entradas de `src/services/catalog/*.js` y
  `src/hooks/catalog/*.js` se compilaron individualmente con esbuild: PASS.

La compilacion individual es necesaria porque la aplicacion publica V1 aun no
importa la capa V2.

## 6. Despliegue remoto completado

El bloqueo remoto quedó resuelto el 2026-07-27 mediante el MCP oficial de
Supabase:

- `001` a `006` y `009` aplicadas.
- Respaldo V1: 105/105 productos y 23 definiciones SQL.
- RPC pública `catalog_list_cards`: 4 tarjetas para Globos de látex.
- Cada tarjeta incluye `presentation_count`.
- Precio, detalle, facetas, búsqueda y carrito canónico validados.
- Pedido V2 validado con rollback: snapshot, inventario, idempotencia y
  sobreventa.
- RLS validada con los roles `anon` y `authenticated`.

## 7. Siguiente accion exacta

1. Continuar con la Fase 4 usando los repositorios V2.
2. Implementar primero catálogos auxiliares y navegación del panel.
3. Después implementar productos, variantes, presentaciones, precios e
   inventario.
4. Mantener `007` sin ejecutar mientras el frontend V1 siga activo.

No ejecutar `007_catalog_remove_legacy.sql`.
`008_catalog_rollback.sql` se conserva solo para emergencia.
