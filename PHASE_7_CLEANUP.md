# Fase 7 - Cierre del catalogo V2

Fecha: 2026-07-28

## Resultado

- `/catalogo` usa exclusivamente el catalogo V2.
- Landing, dashboard e inventario administrativo dejaron de consultar
  `public.productos`.
- Picking y cancelacion usan RPC transaccionales para reservar, confirmar o
  liberar inventario.
- El rastreo publico conserva solo la consulta por folio.
- Se retiro el arbol React, hooks, repositorios y pruebas del catalogo V1.
- `public.productos` y `crear_pedido_publico` fueron eliminados en Supabase.
- `public.productos_backup_v1` y `public.catalog_v1_object_backup` se conservan
  como respaldo de emergencia.

## Migraciones aplicadas

### `catalog_inventory_lifecycle`

- Agrega `catalog_inventory.low_stock_threshold`.
- Mantiene `catalog_create_order` como interfaz publica segura.
- Registra ubicacion y estado de inventario en cada snapshot V2.
- Agrega `catalog_fulfill_order(uuid, jsonb)`.
- Agrega `catalog_cancel_order_inventory(uuid)`.
- Revoca acceso directo al nucleo privado de creacion.
- Fija `search_path` y permisos de las funciones `SECURITY DEFINER`.

### `remove_legacy_catalog_v1`

- Elimina el canonicalizador y checkout V1.
- Elimina la vista de facetas V1.
- Retira `productos` de Realtime.
- Elimina `public.productos`.

## Datos de prueba

Con autorizacion del propietario se eliminaron todos los pedidos de prueba.
Antes de borrarlos se liberaron todas las reservas. Estado final:

- Pedidos persistentes: `0`
- Inventario reservado: `0`
- Productos V2: `4`
- Filas de inventario V2: `28`

## Verificacion

- `npm test`: 142 pruebas aprobadas.
- `npm run build`: compilacion de produccion aprobada.
- `npm run test:e2e:public`: 6 pruebas aprobadas en escritorio y movil.
- Axe WCAG A/AA: sin violaciones serias o criticas en el catalogo probado.
- Prueba SQL reversible:
  `reservar -> surtir -> cancelar -> ROLLBACK`, sin alterar existencias.
- Navegador real:
  catalogo, detalle, inventario y dashboard cargan sin errores de consola.

## Cierre de seguridad posterior

La migracion `secure_admins_rls` cerro el pendiente independiente:

- Habilita RLS en `public.admins`.
- Mantiene la tabla sin politicas para negar todo acceso desde clientes.
- Conserva el acceso privilegiado requerido por el trigger de perfiles.
- Revoca la ejecucion anonima de helpers internos de autenticacion y roles.
- Restringe la consulta de correos existentes al rol `admin`.
- Fija el `search_path` de las funciones incluidas en la migracion.
- Cierra la ejecucion RPC de los helpers internos de folio y timestamps.

### Extension e imagenes

- Mueve `pg_trgm` de `public` a `extensions`.
- Conserva validos los cinco indices trigram del catalogo.
- Elimina el listado anonimo del bucket publico `productos-imagenes`.
- Limita la gestion de archivos a los roles `admin` y `manager`.
- Restringe cargas a AVIF, JPEG, PNG o WebP con un maximo de 5 MB.
- Conserva las URLs publicas de imagenes sin una policy publica de listado.

## Configuracion pendiente en Dashboard

El asesor de Auth mantiene el aviso `auth_leaked_password_protection`. Esta
proteccion se habilita desde la configuracion de autenticacion del Dashboard
de Supabase y no mediante una migracion SQL.
