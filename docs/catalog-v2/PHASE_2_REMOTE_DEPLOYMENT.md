# Despliegue remoto del Catalogo V2

Fecha: 2026-07-27
Proyecto: `byvjdsqduapzfhdkdwcw`
PostgreSQL remoto: 17.6

## Migraciones aplicadas

En el historial remoto quedaron registradas:

1. `catalog_v2_001_backup_and_cleanup`
2. `catalog_v2_002_schema`
3. `catalog_v2_003_constraints_indexes`
4. `catalog_v2_004_rls`
5. `catalog_v2_005_functions`
6. `catalog_v2_006_seed`
7. `order_idempotency_canonical_total`
8. `catalog_v2_009_rls_policy_optimization`

`007_catalog_remove_legacy.sql` no se ejecuto.
`008_catalog_rollback.sql` queda reservado para emergencia.

## Respaldo verificado

- `public.productos`: 105 filas.
- `public.productos_backup_v1`: 105 filas.
- `public.catalog_v1_object_backup`: 23 definiciones.
- RLS habilitado en ambas tablas de respaldo.
- `anon` y `authenticated` no tienen privilegio de lectura.

## Datos V2

| Objeto | Filas |
|---|---:|
| Categorias | 15 |
| Colecciones | 14 |
| Marcas | 8 |
| Gamas | 11 |
| Colores | 41 |
| Medidas | 18 |
| Productos demo | 4 |
| Variantes | 28 |
| Presentaciones | 54 |
| Escalones de precio | 25 |
| Inventarios | 28 |
| Alias de busqueda | 17 |

## Pruebas remotas

- API anonima: 15 categorias activas.
- `catalog_list_cards('globos-latex')`: 4 tarjetas agrupadas por gama.
- `presentation_count` presente en tarjetas.
- Detalle Glomex: 25 variantes.
- Busqueda `cromado`: 1 resultado.
- Mayoreo: 11 bolsas a 85, 12 y 20 bolsas a 78.
- Carrito: 12 bolsas, total 936, nivel Mayoreo, 1,200 unidades.
- Pedido transaccional con rollback:
  - Caja a 900.
  - Reserva compartida de 1,200 unidades.
  - Snapshot V2 completo.
  - Replay idempotente sin duplicar.
  - Inventario separado por presentacion.
  - Sobreventa bloqueada.
- RLS:
  - `anon` no lee inventario ni respaldos y no escribe.
  - `authenticated` con rol de panel lee y administra el catalogo.
  - Cero avisos de politicas SELECT permisivas duplicadas en `catalog_*`.
- La prueba con rollback no dejo pedidos, reservas ni productos temporales.

## Drift corregido

La base remota no tenia `pedidos.idempotency_key`, aunque el repositorio y el
checkout ya dependian de `supabase_order_idempotency.sql`.

Se aplico la migracion existente:

- Columna UUID nullable.
- Indice unico parcial.
- RPC `crear_pedido_publico` con total canonico y replay.
- Los 36 pedidos existentes permanecieron sin cambios.

## Advisors pendientes

### Catalogo

- Las RPC `catalog_*` aparecen como `SECURITY DEFINER` ejecutables por `anon`
  y `authenticated`. Es intencional: son la API publica controlada, validan
  entradas, limitan filas activas y no exponen `catalog_inventory`.
- Las tablas de respaldo tienen RLS sin politicas. Es intencional: son
  internas y permanecen inaccesibles para roles del Data API.
- Los indices nuevos aparecen inicialmente como no usados. No deben retirarse
  antes de probar volumen real.

### Fuera del alcance del catalogo

- `public.admins` tiene RLS desactivado. Requiere disenar politicas compatibles
  con el panel antes de habilitarlo.
- `pg_trgm` ya estaba instalado en `public`; las extensiones nuevas
  `unaccent` y `btree_gist` se instalaron en `extensions`.
- El bucket publico `productos-imagenes` permite listado amplio.
- La proteccion de contrasenas filtradas de Supabase Auth esta desactivada.
