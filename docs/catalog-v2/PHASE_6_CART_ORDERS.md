# Fase 6 - Carrito y pedidos V2

## Alcance completado

La ruta `/catalogo` ya permite completar el flujo de compra con los contratos
normalizados del catalogo:

- Carrito V2 identificado por `variant_id` y `sale_presentation_id`.
- Lineas separadas para variantes o presentaciones diferentes.
- Acumulacion de la misma variante y presentacion.
- Recalculo local de precio, escalon, subtotal y contenido total.
- Controles de cantidad compatibles con minimo, paso, maximo y existencia.
- Drawer responsive con formulario de recoleccion o envio.
- Persistencia local versionada del carrito y del borrador de checkout.
- Deteccion controlada del carrito V1 sin mezclar datos incompatibles.
- Validacion canonica de precio y existencia con `catalog_validate_cart`.
- Creacion transaccional mediante `catalog_create_order`.
- Reintentos idempotentes mediante una llave UUID persistida por intento.
- Mensaje de WhatsApp generado con el snapshot canonico del pedido.

## Seguridad e integridad

La interfaz nunca envia precios calculados por el navegador como fuente de
verdad. Antes de crear el folio:

1. `catalog_validate_cart` recalcula precio, nivel e inventario.
2. La interfaz bloquea el pedido si el servidor devuelve incidencias.
3. `catalog_create_order` vuelve a validar dentro de la transaccion.
4. El servidor bloquea las filas de inventario, reserva existencia y guarda el
   snapshot V2 en `pedidos.detalles_json`.
5. La llave de idempotencia evita duplicados si hay reintentos de red.

No fue necesario modificar el esquema remoto en esta fase: los RPC fueron
desplegados y probados durante la Fase 2.

## Persistencia

El carrito se guarda en `fullPartyCatalogCartV2` con `schema: 2`. Cada linea
conserva una instantanea suficiente para mostrar el pedido sin depender de las
tablas V1, pero el servidor vuelve a resolver todos los datos comerciales al
confirmarlo.

Si existe `carritoPWA`, la interfaz muestra un aviso y permite descartarlo. No
se migra automaticamente porque ese formato no contiene la variante ni la
presentacion necesarias para construir una linea V2 confiable.

El borrador del cliente se guarda en `fullPartyCatalogCheckoutV2`. La llave
temporal del intento se guarda en `fullPartyCatalogOrderAttemptV2` y se elimina
solo despues de una creacion exitosa.

## WhatsApp

El mensaje final incluye:

- Folio y enlace de rastreo.
- Cliente, telefono y forma de entrega.
- Producto, marca, gama, color y medida.
- Presentacion, cantidad, precio aplicado y nivel de precio.
- Contenido total, SKU, subtotal y total canonico.

El carrito se vacia solamente despues de que Supabase devuelve un folio. Si el
navegador bloquea la ventana automatica, el estado de exito conserva un enlace
directo para abrir WhatsApp.

## Validacion

Se verifico:

1. `npm test`: 173 de 173 pruebas aprobadas.
2. `npm run build`: build de produccion completado.
3. Flujo real en escritorio: seleccion, alta, drawer y cambio de cantidad.
4. Restauracion tras recargar: 2 bolsas y total de $170.00.
5. Viewport movil de 390 por 844 pixeles, sin desbordamiento visible.
6. Consola del navegador sin errores ni advertencias.
7. RPC remoto de solo lectura:
   - 1 bolsa Glomex Estandar Roja de 12 pulgadas: $85.00.
   - 12 bolsas: $78.00 por bolsa, $936.00 y 1,200 piezas.

No se creo ningun pedido real durante las pruebas manuales, por lo que tampoco
se reservo inventario.

## Siguiente fase

La Fase 7 debe retirar dependencias publicas V1 y reemplazar el antiguo archivo
`tests/e2e/public-catalog.spec.js`, que todavia simula el catalogo previo. La
migracion destructiva `007` no debe ejecutarse hasta identificar y retirar todas
las dependencias V1 restantes.
