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

1. Listado y editor por pasos de `catalog_products`.
2. Variantes y presentaciones.
3. Escalones de precio.
4. Inventario por sucursal.
5. Generador masivo de combinaciones.
6. Importacion CSV y edicion masiva.
