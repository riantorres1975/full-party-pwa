# Tarifario confirmado - Globos Glomex

Fuente: Full Party Uruapan, 27 de julio de 2026.

El mayoreo aplica desde 12 bolsas, salvo las presentaciones de 18 pulgadas.
Las cajas contienen 100 bolsas y conservan su precio independiente.

| Medida | Gama | Contenido por bolsa | Normal | Mayoreo |
|---|---|---:|---:|---:|
| 18 pulgadas | Estándar, Retro, Macarrón | 25 piezas | $100 | No aplica |
| 18 pulgadas | Chrome | 25 piezas | $150 | No aplica |
| 18 pulgadas | Estándar, Retro, Macarrón | 5 piezas | $35 | No aplica |
| 18 pulgadas | Chrome | 3 piezas | $27 | No aplica |
| 12 pulgadas | Estándar, Retro, Macarrón | 100 piezas | $85 | $78 |
| 12 pulgadas | Hazy, Trendy | 100 piezas | $95 | $88 |
| 12 pulgadas | Chrome | 50 piezas | $80 | $70 |
| 10 pulgadas | Estándar, Retro, Macarrón | 50 piezas | $37 | $34 |
| 10 pulgadas | Chrome | 50 piezas | $60 | $50 |
| 5 pulgadas | Estándar, Retro, Macarrón | 100 piezas | $50 | $42 |
| 5 pulgadas | Chrome | 100 piezas | $90 | $72 |

## Aplicación actual

La migración `011_catalog_glomex_pricing.sql` corrige todas las variantes
publicadas que coinciden con este tarifario y cambia las cajas existentes a
100 bolsas.

Retro, Hazy y Trendy todavía no tienen colores asociados. Tampoco existen aún
todas las variantes de 18, 10 y 5 pulgadas para Macarrón y Chrome. Se conserva
el tarifario en este documento para crearlas cuando sus combinaciones
comerciales estén definidas, sin publicar selectores de color incompletos.
