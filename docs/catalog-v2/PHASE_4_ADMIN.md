# Fase 4 - Panel administrativo V2

## Alcance de la primera entrega

La ruta `/admin/catalogo` deja de montar el editor monolitico conectado a la
tabla V1 `productos`. Ahora abre un workspace conectado a las tablas
normalizadas del catalogo V2.

Catalogos auxiliares incluidos:

- Categorias y subcategorias.
- Colecciones.
- Marcas.
- Gamas o lineas.
- Familias de color.
- Colores exactos.
- Medidas.
- Atributos.
- Sucursales.

Cada recurso cuenta con:

- Listado y busqueda local.
- Conteo remoto.
- Alta y edicion para roles `admin` y `manager`.
- Eliminacion para rol `admin`.
- Formularios derivados de una definicion central.
- Validaciones puras antes de enviar datos a Supabase.
- Relaciones contextuales, por ejemplo gama-marca y color-familia.
- Estado visible/oculto cuando la tabla lo soporta.

## Arquitectura

- `adminCatalogModel.js`: definiciones, normalizacion y validaciones puras.
- `adminCatalogRepository.js`: lectura y CRUD mediante Supabase con RLS.
- `useAdminCatalogWorkspace.js`: carga, estados y mutaciones.
- `components/admin/catalog-v2`: navegacion, listado y formulario.

No se incorpora un selector permanente entre V1 y V2. El archivo V1 permanece
temporalmente en el repositorio hasta extraer cualquier utilidad reutilizable,
pero ya no es el punto de entrada de `/admin/catalogo`.

## Contrato visual para la fase 5

El [mockup aprobado](./assets/catalog-v2-mockup.png), entregado el 27 de julio
de 2026, define la direccion del catalogo publico:

- Escritorio con cabecera de familias, filtros laterales y cuadrilla de cuatro
  tarjetas.
- Movil con inicio por categorias, exploracion por gama, filtros compactos y
  navegacion inferior.
- Tarjetas agrupadas con imagen dominante, favorito, precio base, aviso de
  mayoreo y CTA `Elegir opciones`.
- Detalle con selectores progresivos, presentacion bolsa/caja, cantidad,
  precio aplicado y tabla de escalones.
- Adaptacion real entre escritorio y movil, no una reduccion lineal del mismo
  layout.

Este contrato se implementara en la fase 5 usando los datos que administra el
workspace V2.

## Siguiente bloque

La segunda entrega incorpora:

- Listado de familias en `catalog_products`.
- Busqueda por nombre o slug.
- Paginacion y busqueda en servidor para no cargar miles de arboles comerciales
  en una sola consulta.
- Indicadores de variantes, presentaciones, precio minimo e inventario.
- Editor por secciones para informacion, variantes, precios e inventario.
- Vista previa de la tarjeta publica.
- Lectura de escalones de mayoreo y existencias por sucursal.
- Creacion, edicion y eliminacion de la familia principal.

Siguiente bloque:

La tercera entrega incorpora:

- CRUD de variantes con gama, color, medida, acabado, SKU e imagen.
- Politica de inventario compartido o separado por presentacion.
- CRUD de presentaciones directas y compuestas.
- Calculo asistido de unidades base para cajas y paquetes.
- Edicion de precio normal, limites de compra y orden comercial.
- CRUD de escalones de mayoreo con deteccion local de rangos superpuestos.
- Captura de existencia y reserva por sucursal.
- Permisos alineados con RLS: `admin` y `manager` escriben; solo `admin`
  elimina.
- Recarga puntual del producto editado despues de cada mutacion.

Siguiente bloque:

1. Generador masivo de combinaciones.
2. Copia y edicion de configuracion por lotes.
3. Importacion y exportacion CSV.
4. Edicion masiva.

## Cuarta entrega

La cuarta entrega cierra las herramientas masivas del panel:

- Pestaña `Masivo` dentro del editor de cada familia.
- Matriz cartesiana de gama, colores y medidas con combinaciones existentes
  bloqueadas de forma explicita.
- Activacion individual, SKU, codigo de barras, imagen, contenido, precio,
  mayoreo e inventario editables por fila.
- Copia de configuracion desde la primera fila activa al resto del lote.
- Creacion opcional de una caja compuesta para cada variante.
- Exportacion CSV UTF-8 del arbol comercial actual.
- Plantilla CSV e importacion acotada al producto seleccionado.
- Resolucion de gama, color, medida y sucursal contra catalogos existentes.
- Vista previa obligatoria con errores por linea y accion crear/actualizar.
- Procesamiento en lotes de hasta 50 filas.
- Resumen de registros creados, actualizados y rechazados.

La migracion `010_catalog_bulk_operations.sql` agrega
`catalog_admin_apply_commercial_rows(uuid, jsonb)`. La funcion usa
`SECURITY INVOKER`, conserva RLS y procesa cada fila en una subtransaccion:
un error en precio, caja o inventario revierte toda esa fila sin dejar una
variante incompleta.

La importacion no crea categorias, marcas, gamas, colores, medidas ni
sucursales silenciosamente. Esos valores deben existir en `Datos base`.

## Siguiente fase

La Fase 5 implementara el catalogo publico del mockup aprobado:

1. Tarjetas agrupadas por producto o gama.
2. Navegacion jerarquica y colecciones.
3. Detalle con seleccion progresiva de variante y presentacion.
4. Filtros y busqueda server-side.
5. URLs compartibles con restauracion de filtros y scroll.
