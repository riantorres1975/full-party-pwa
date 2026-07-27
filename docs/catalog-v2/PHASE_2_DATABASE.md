# Fase 2 — Base de datos del Catálogo V2

Fecha: 2026-07-27 · Rama: `refactor/catalog-v2`

## 1. Resumen de cambios

Se creó el esquema completo del catálogo V2 como migraciones SQL ordenadas e
idempotentes, validadas contra PostgreSQL 15 y 17 (Docker) con todo el
estado V1 aplicado previamente. **Todos los casos de prueba automáticos pasan**
(22 funcionales §33 + 9 de seguridad RLS).

## 2. Archivos creados

| Archivo | Contenido |
|---|---|
| `001_catalog_backup_and_cleanup.sql` | Respaldo en BD: `productos_backup_v1` (copia total) + `catalog_v1_object_backup` (definiciones de vista/políticas/índices/triggers/funciones V1) con verificación de conteo |
| `002_catalog_schema.sql` | 21 tablas `catalog_*` con checks de dominio, trigger genérico `updated_at`, publicación Realtime |
| `003_catalog_constraints_indexes.sql` | EXCLUDE anti-traslape de escalones, ~45 índices (FK, slugs, active, trigram, tsvector), triggers anti-ciclos (categorías y presentaciones), consistencia inventario↔política, SKU único parcial |
| `004_catalog_rls.sql` | RLS en las 21 tablas: público lee solo activos; panel por rol (viewer/empleado leen, manager escribe, admin borra); inventario y sucursales solo panel |
| `005_catalog_functions.sql` | 7 RPCs públicas SECURITY DEFINER + parche de convivencia en `canonicalize_public_pedido` |
| `006_catalog_seed.sql` | 3 sucursales, 15 categorías jerárquicas, 14 colecciones, 8 marcas, 11 gamas Glomex, 13 familias de color, 41 colores, 18 medidas, 8 atributos, 17 alias de búsqueda y 4 productos demo que implementan los casos §33 |
| `007_catalog_remove_legacy.sql` | Eliminación del V1 con guardas (solo al final de la refactorización) |
| `008_catalog_rollback.sql` | Reversa de emergencia: restaura `productos` desde el respaldo y elimina el esquema V2 |
| `009_catalog_rls_policy_optimization.sql` | Separa lectura pública (`anon`) de lectura del panel (`authenticated`) para eliminar políticas permisivas duplicadas |
| `supabase_productos_mayoreo_migration.sql` | **Drift documentado**: columnas `es_nuevo`/`precios_mayoreo`/`familia_mayoreo` que existían en la BD real sin migración en el repo |
| `supabase/tests/catalog-v2/` | Harness Docker: bootstrap + runner + 31 aserciones + README |

## 3. Modelo final (resumen)

```
catalog_categories (parent_id) ─┐
                                ▼
catalog_brands ──► catalog_product_lines ──► catalog_line_colors ◄── catalog_colors ◄── catalog_color_families
      │                    │                                                ▲
      ▼                    ▼                                                │
catalog_products ──► catalog_variants ◄── catalog_sizes                     │
      │                    │                                                │
      │                    ▼                                                │
      │          catalog_sale_presentations (anidadas)                      │
      │                    │                                                │
      │                    ▼                                                │
      │          catalog_price_tiers (EXCLUDE sin traslapes)                │
      │                                                                     │
      ├─► catalog_collection_products ◄── catalog_collections               │
      ├─► catalog_product_images                                          │
      ├─► catalog_product_relations                                       │
      └─► catalog_variants ──► catalog_variant_attribute_values ──────────┘
                               catalog_inventory ──► catalog_locations
```

## 4. Decisiones técnicas

| # | Decisión | Razón |
|---|---|---|
| D1 | Variante = `(producto, gama, color, medida, finish)` con `UNIQUE NULLS NOT DISTINCT` (PG15) | Impide duplicados aunque el producto no tenga gama/color/medida (no-globos) |
| D2 | Presentación con forma exclusiva: contenido directo XOR anidado (`content_shape` CHECK) | Evita filas ambiguas mitad bolsa mitad caja; corregido tras detectarlo en pruebas |
| D3 | `quantity_range int4range` generada con `'[)'` + EXCLUDE `btree_gist` | Traslapes imposibles a nivel BD. `'[]'` reventaba con `integer out of range` en el límite superior (int4 max) — corregido en pruebas |
| D4 | Inventario por `(variante, presentación NULL, sucursal)` = unidades base; o por presentación | `shared_base_units` (caja abrible) vs `separate_by_presentation` (caja cerrada), validado por trigger |
| D5 | Pedidos **reservan** (`reserved_quantity += …`) con `SELECT … FOR UPDATE` | Sin sobreventa concurrente; el descuento definitivo ocurre en picking (Fase 6), la liberación al cancelar |
| D6 | `catalog_create_order` recalcula todo en servidor y no acepta total del cliente | Cumple "nunca confirmar con subtotales de React" |
| D7 | Snapshot V2 plano con alias legacy (`nombre`, `cantidad`, `precio`, `tamano`, `imagen_url`) + campos V2 (`gama`, `color`, `medida`, `presentacion`, `contenido_total`, `nivel_precio`, `sku`…) | El admin actual (picking/dashboard) sigue leyendo pedidos V2 sin reescritura inmediata |
| D8 | `canonicalize_public_pedido` (V1) ignora filas con `variant_id` | Convivencia segura: checkout V1 intacto mientras se refactoriza la app; validado por prueba K |
| D9 | RPCs SECURITY DEFINER que solo exponen filas activas; `catalog_inventory` sin lectura pública | La disponibilidad se expone calculada (`available_quantity`), no la tabla cruda |
| D10 | `listing_group_mode = 'line'` agrupa tarjetas por gama | "Una tarjeta por gama" (5 colores ≠ 5 tarjetas); validado: 4 tarjetas para 25 variantes del demo |

## 5. Pruebas ejecutadas

Harness: `supabase/tests/catalog-v2/` (Docker `postgres:15-alpine` y
`postgres:17-alpine`).
Secuencia: bootstrap → 14 SQL de estado V1 → `001…006` + `009` → aserciones.

**Resultado: 31/31 PASS**

- A: seeds base
- B: mayoreo 11→$85, 12→$78, 20→$78, siguiente nivel (faltan 7)
- C: caja = 12 bolsas = 1,200 globos, $900 independiente del mayoreo
- D: oasis (caja 48 piezas, sin bolsa) · espuma (caja anida 12 latas)
- E: bomba manual sin gama/color/medida
- F: Chrome Dorado 5″ no existe
- G1–G4: variante duplicada ✗ · escalón traslapado ✗ · ciclo de presentaciones ✗ · reserved > quantity ✗
- H: 4 tarjetas por gama (no 25 por color) · detalle con 25 variantes · facetas · búsqueda "glomex pastel rosa 12" · alias "cromado"→Chrome
- I: carrito canónico ($78 c/u, subtotal $936, nivel Mayoreo, 1,200 globos)
- J1–J10: pedido $900 · reserva compartida +1200 · snapshot completo · idempotencia sin duplicar · reserva separada oasis · lata+caja comparten base · sobreventa bloqueada `OUT_OF_STOCK`
- K: flujo V1 sigue canonicalizando durante la convivencia
- L1–L9: anon no lee inventario · solo lee activos · no escribe · RPCs públicas OK · inactivos excluidos · pedido solo por RPC · admin escribe/borra · viewer lee inventario · viewer no escribe

Además: `npm test` 110/110 ✓ y `npm run build` ✓ (sin cambios de JS en esta fase).

## 6. Errores encontrados y corregidos durante la validación

| Error | Causa raíz | Fix |
|---|---|---|
| `column "es_nuevo" does not exist` al aplicar `supabase_catalog_scalability.sql` | **Drift repo↔BD**: las columnas de mayoreo se crearon a mano en el dashboard sin migración versionada | Nuevo archivo `supabase_productos_mayoreo_migration.sql` (ver §9) |
| `"array_agg" is an aggregate function` en 001 | `pg_get_functiondef()` no soporta agregados; el filtro ILIKE los evaluaba | Filtrar `prokind IN ('f','p')` antes |
| `integer out of range` en seeds de escalones | `int4range(…, 2147483647, '[]')` desborda int4 al canonicalizar el límite | Bounds `'[)'` en la columna generada |
| `function min(uuid) does not exist` en `catalog_list_cards` | PostgreSQL no tiene agregado min/max para uuid | `(array_agg(…))[1]` para `card_line_id` |
| Hueco de forma de presentación | El CHECK permitía contenido directo Y anidado a la vez | XOR estricto en `content_shape` |

## 7. Estado / pendiente

- [x] Esquema, constraints, índices, RLS, RPCs, seeds — escritos y validados localmente.
- [x] Script de rollback listo.
- [x] `001…006` y `009` aplicadas al Supabase de desarrollo mediante MCP.
- [x] Respaldo remoto verificado: 105/105 productos y 23 objetos SQL.
- [x] Drift de `pedidos.idempotency_key` corregido con `supabase_order_idempotency.sql`.
- [x] Fase 3: capa de datos en `src/services/catalog/` y `src/hooks/catalog/`.
- [ ] Importación controlada de productos reales V1 → V2 (paso 7 del plan, siguiente).
- [ ] Fase 4: panel administrativo V2.

## 8. Riesgos abiertos

- Las RPC de lectura calculan disponibilidad con subconsultas por fila; con
  miles de variantes conviene revisar planes de ejecución (índices ya puestos;
  se medirá en Fase 8 con volumen real).
- `catalog_search` usa coincidencia por tokens normalizados; Fuse.js queda
  como refinamiento local en el cliente (Fase 3/5).
- `public.admins` tiene RLS desactivado. Es un riesgo previo y ajeno a las
  tablas `catalog_*`; no se habilitó automáticamente porque requiere políticas
  compatibles con el panel actual.

## 9. Despliegue en Supabase de desarrollo

El despliegue remoto se completó el 2026-07-27 mediante el MCP oficial de
Supabase sobre PostgreSQL 17.6.

El reporte completo está en
`docs/catalog-v2/PHASE_2_REMOTE_DEPLOYMENT.md`.

## 10. Siguiente fase

**Fase 4 — Panel administrativo:** catálogos auxiliares, productos, variantes,
presentaciones, precios, inventario, generación masiva e importación CSV.

No ejecutar `007_catalog_remove_legacy.sql` hasta cerrar la Fase 7.
`008_catalog_rollback.sql` se conserva solo para emergencia.
