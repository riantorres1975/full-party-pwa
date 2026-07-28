# Harness de pruebas SQL — Catálogo V2

Valida las migraciones `001…006` y `009…011` del catálogo V2 contra PostgreSQL 15
y 17, aplicando primero TODO el estado V1 del repositorio y luego ejecutando
los casos de prueba obligatorios del §33 del plan maestro más las
verificaciones RLS.

## Contenido

| Archivo | Rol |
|---|---|
| `00_bootstrap.sql` | Stubs del entorno Supabase en Postgres vanilla: esquema `auth` + `auth.uid()` (configurable con `SET test.uid`), roles `anon`/`authenticated`/`service_role`, publicación `supabase_realtime` |
| `98_test_cases_a.sql` | Casos A–H: seeds, mayoreo, caja, oasis/espuma, producto simple, combinaciones inexistentes, constraints, RPCs de lectura |
| `99_test_cases_b.sql` | Casos I–L: validación de carrito, pedidos + snapshot, inventario compartido/separado, idempotencia, sobreventa, compatibilidad V1, RLS público vs panel |
| `run_all.sh` | Runner: aplica V1 → V2 → pruebas, en orden, con `ON_ERROR_STOP` |

## Ejecutar (Docker)

```bash
docker run -d --name pg-catalog-test -e POSTGRES_PASSWORD=postgres postgres:17-alpine
# esperar unos segundos a que inicie
docker exec pg-catalog-test psql -U postgres -c "CREATE DATABASE catalog_test;"
docker exec pg-catalog-test mkdir -p /harness /repo

# copiar SQL del repo (estado V1 + migraciones V2)
for f in supabase_*.sql 0??_catalog_*.sql; do docker cp "$f" pg-catalog-test:/repo/; done
for f in supabase/tests/catalog-v2/*; do docker cp "$f" pg-catalog-test:/harness/; done

docker exec pg-catalog-test sh /harness/run_all.sh
```

Salida esperada: líneas `PASS …` para cada caso y
`══ TODOS LOS CASOS DE PRUEBA + RLS PASARON ══`.

Para una corrida limpia:

```bash
docker exec pg-catalog-test psql -U postgres -c "DROP DATABASE catalog_test;"
docker exec pg-catalog-test psql -U postgres -c "CREATE DATABASE catalog_test;"
docker exec pg-catalog-test sh /harness/run_all.sh
```

## Cobertura (§33 del plan maestro)

- [x] Globo con mayoreo: 11×$85, 12×$78, 20×$78, nivel indicado, total del servidor
- [x] Globo por caja: 1 caja = 100 bolsas, precio de caja independiente ($900), snapshot y mensaje por caja
- [x] Tarifario Glomex: Standard 5/10/12 y Chrome 12 con mayoreo desde 12 bolsas
- [x] Caja de piezas (oasis, sin bolsa)
- [x] Caja de latas (espuma, anidación de presentaciones)
- [x] Producto simple (bomba, sin gama/color/medida)
- [x] Combinación inexistente (Chrome Dorado 5″)
- [x] Inventario compartido (reserva en unidades base)
- [x] Inventario separado (reserva por presentación)
- [x] Carrito canónico (precio de servidor, nivel, contenido total)
- [x] Pedido con snapshot completo + idempotencia + bloqueo de sobreventa
- [x] RLS: público solo lee activos / no lee inventario / no escribe; panel por rol
- [x] Operación masiva atómica: variante + presentación + mayoreo + caja + inventario
- [x] RPC masiva bloqueada para `anon` y `viewer`
