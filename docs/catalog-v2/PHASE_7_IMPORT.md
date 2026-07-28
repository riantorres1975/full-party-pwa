# Importación controlada V1 a V2

Fecha: 2026-07-28

Migración: `supabase/migrations/20260728172352_import_catalog_v1.sql`

## Resultado

Se importaron 104 de las 105 filas del respaldo `productos_backup_v1`.
El único registro excluido fue `Prueba`, identificado como dato temporal.

| Entidad V2 | Total después de importar |
|---|---:|
| Familias de producto | 27 |
| Variantes | 121 |
| Presentaciones | 184 |
| Escalones de precio | 76 |
| Filas de inventario | 121 |
| Imágenes reales | 104 |

## Agrupación aplicada

- 44 filas Glomex se integraron en `globo-latex-glomex`.
- 28 letras LED se integraron en `letras-led-decorativas`.
- 8 colores Orbz se integraron en `globos-orbz-economicos`.
- Oasis, espuma en aerosol y bomba manual enriquecieron las familias demo
  equivalentes.
- 21 artículos restantes se importaron como productos simples.

El mapeo Glomex es explícito por nombre, gama, color y familia de color. La
migración no usa similitud automática.

## Precios e inventario

- Se conservaron los precios Glomex V2 confirmados por el negocio.
- Las cajas Glomex siguen configuradas con 100 bolsas.
- El inventario Glomex del seed se puso en cero antes de cargar las 988 bolsas
  reales del respaldo, equivalentes a 98,800 globos en unidades base.
- Los escalones JSONB V1 se transformaron a `catalog_price_tiers` sin
  traslapes.
- Oasis usa inventario compartido de 480 bloques.
- Espuma usa inventario compartido de 200 latas.
- La bomba manual quedó en $45, mayoreo de $40 desde 12 piezas y existencia 2.
- `Mega Shine 570 Ml` era el único producto V1 con stock ilimitado. Como V2 no
  tiene esa bandera, se conservó disponible con una reserva operativa de
  999,999 botellas hasta que el negocio defina inventario físico.

## Controles

La migración aborta si:

- El respaldo no contiene 105 filas.
- Existe inventario reservado.
- Falta un mapeo de categoría, marca, gama o color.
- No coinciden los 44 productos Glomex esperados.
- Los conteos finales o existencias críticas no coinciden.
- Se intenta aplicar la importación por segunda vez.

Antes de aplicarla se ejecutó completa dentro de una transacción remota con
`ROLLBACK`. Después se validaron los conteos, el catálogo público, el detalle
Glomex Retro, las imágenes y el panel administrativo.
