import { slugifyCatalogValue } from './adminCatalogModel.js';

export const BULK_CSV_COLUMNS = [
  'producto',
  'slug',
  'categoria',
  'subcategoria',
  'marca',
  'gama',
  'color_exacto',
  'familia_color',
  'codigo_color',
  'medida',
  'acabado',
  'sku_variante',
  'codigo_barras_variante',
  'presentacion',
  'tipo_presentacion',
  'cantidad_contenida',
  'unidad_contenida',
  'presentacion_contenida',
  'cantidad_presentaciones',
  'unidades_base_totales',
  'precio_normal',
  'mayoreo_desde',
  'mayoreo_hasta',
  'precio_mayoreo',
  'politica_inventario',
  'sucursal',
  'existencia',
  'reservado',
  'imagen',
  'activo',
];

function clean(value) {
  return String(value ?? '').trim();
}

function nullable(value) {
  return clean(value) || null;
}

function numberOrNull(value) {
  if (value === '' || value == null) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function integerOrNull(value) {
  const number = numberOrNull(value);
  return number != null && Number.isInteger(number) ? number : null;
}

function booleanValue(value, fallback = true) {
  const normalized = clean(value).toLocaleLowerCase('es');
  if (!normalized) return fallback;
  return !['0', 'false', 'no', 'inactivo'].includes(normalized);
}

const PRESENTATION_TYPES = new Set([
  'pieza',
  'bolsa',
  'paquete',
  'caja',
  'lata',
  'rollo',
  'botella',
  'juego',
  'otro',
]);

function comparable(value) {
  return slugifyCatalogValue(value);
}

function sameNullable(left, right) {
  return nullable(left) === nullable(right);
}

function findLookup(items, value, keys) {
  const target = comparable(value);
  if (!target) return null;
  return items.find((item) =>
    keys.some((key) => comparable(item?.[key]) === target)) ?? null;
}

function findVariant(product, row) {
  return product?.variants?.find((variant) =>
    sameNullable(variant.line_id, row.line_id)
    && sameNullable(variant.color_id, row.color_id)
    && sameNullable(variant.size_id, row.size_id)
    && sameNullable(variant.finish, row.finish)) ?? null;
}

function formatSku(pattern, values) {
  return clean(pattern)
    .replace(/\{(product|line|color|size|index)\}/gi, (_, key) => values[key.toLowerCase()] ?? '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLocaleUpperCase('es');
}

export function createBulkGeneratorDraft(product = null) {
  return {
    line_id: '',
    color_ids: [],
    size_ids: [],
    finish: '',
    sku_pattern: `${product?.slug || 'producto'}-{line}-{color}-{size}`,
    inventory_policy: 'shared_base_units',
    presentation_name: 'Bolsa',
    presentation_type: 'bolsa',
    base_unit: 'pieza',
    contained_quantity: 100,
    contained_unit: 'pieza',
    base_price: 0,
    wholesale_minimum: '',
    wholesale_price: '',
    include_box: false,
    box_name: 'Caja',
    box_quantity: 12,
    box_price: 0,
    location_id: '',
    inventory_quantity: 0,
  };
}

export function buildVariantMatrix(product, input, lookups) {
  const colors = input.color_ids.length
    ? input.color_ids.map((id) => lookups.colors.find((item) => item.id === id)).filter(Boolean)
    : [null];
  const sizes = input.size_ids.length
    ? input.size_ids.map((id) => lookups.sizes.find((item) => item.id === id)).filter(Boolean)
    : [null];
  const line = lookups.lines.find((item) => item.id === input.line_id) ?? null;
  let index = 0;

  return colors.flatMap((color) => sizes.map((size) => {
    index += 1;
    const identity = {
      line_id: line?.id ?? null,
      color_id: color?.id ?? null,
      size_id: size?.id ?? null,
      finish: nullable(input.finish),
    };
    const existing = findVariant(product, identity);
    const labels = {
      product: product.slug,
      line: line?.slug ?? '',
      color: color?.slug ?? '',
      size: size?.slug ?? slugifyCatalogValue(size?.name ?? ''),
      index: String(index).padStart(2, '0'),
    };

    return {
      key: [identity.line_id, identity.color_id, identity.size_id, identity.finish, index]
        .map((value) => value ?? '-')
        .join(':'),
      enabled: !existing,
      existing,
      label: [line?.name, color?.exact_name, size?.name, input.finish]
        .filter(Boolean)
        .join(' / ') || 'Variante simple',
      ...identity,
      sku: existing?.sku ?? formatSku(input.sku_pattern, labels),
      barcode: existing?.barcode ?? '',
      image_url: existing?.image_url ?? '',
      contained_quantity: numberOrNull(input.contained_quantity) ?? 0,
      base_price: numberOrNull(input.base_price) ?? 0,
      wholesale_minimum: integerOrNull(input.wholesale_minimum),
      wholesale_price: numberOrNull(input.wholesale_price),
      inventory_quantity: numberOrNull(input.inventory_quantity) ?? 0,
    };
  }));
}

export function matrixRowToBulkPayload(row, draft) {
  return {
    row_key: row.key,
    variant: {
      id: row.existing?.id ?? null,
      line_id: row.line_id,
      color_id: row.color_id,
      size_id: row.size_id,
      finish: row.finish,
      sku: nullable(row.sku),
      barcode: nullable(row.barcode),
      image_url: nullable(row.image_url),
      inventory_policy: draft.inventory_policy,
      active: true,
    },
    presentation: {
      name: clean(draft.presentation_name),
      presentation_type: clean(draft.presentation_type) || 'otro',
      base_unit: clean(draft.base_unit) || 'pieza',
      contained_quantity: numberOrNull(row.contained_quantity),
      contained_unit: clean(draft.contained_unit) || 'pieza',
      contains_presentation_name: null,
      contains_quantity: null,
      base_units_total: numberOrNull(row.contained_quantity),
      base_price: numberOrNull(row.base_price),
      minimum_order_quantity: 1,
      quantity_step: 1,
      inventory_policy: null,
      active: true,
    },
    tier: row.wholesale_minimum && row.wholesale_price != null
      ? {
        minimum_quantity: integerOrNull(row.wholesale_minimum),
        maximum_quantity: null,
        price_per_presentation: numberOrNull(row.wholesale_price),
        label: 'Mayoreo',
        active: true,
      }
      : null,
    box: draft.include_box
      ? {
        name: clean(draft.box_name),
        presentation_type: 'caja',
        base_unit: clean(draft.base_unit) || 'pieza',
        contains_quantity: numberOrNull(draft.box_quantity),
        base_units_total: (numberOrNull(row.contained_quantity) ?? 0)
          * (numberOrNull(draft.box_quantity) ?? 0),
        base_price: numberOrNull(draft.box_price),
        minimum_order_quantity: 1,
        quantity_step: 1,
        active: true,
      }
      : null,
    inventory: draft.location_id
      ? {
        location_id: draft.location_id,
        quantity: numberOrNull(row.inventory_quantity),
        reserved_quantity: 0,
      }
      : null,
  };
}

export function validateMatrixRows(rows, draft) {
  const enabledRows = rows.filter((row) => row.enabled);
  const errors = [];
  if (!enabledRows.length) errors.push('Activa al menos una combinacion nueva.');
  if (!clean(draft.presentation_name)) errors.push('Indica el nombre de la presentacion.');
  if (!(numberOrNull(draft.contained_quantity) > 0)) {
    errors.push('Las unidades por presentacion deben ser mayores a cero.');
  }
  if (!(numberOrNull(draft.base_price) >= 0)) errors.push('El precio base no puede ser negativo.');
  const skuCounts = new Map();
  for (const row of enabledRows) {
    const sku = clean(row.sku).toLocaleUpperCase('es');
    if (sku) skuCounts.set(sku, (skuCounts.get(sku) ?? 0) + 1);
  }
  for (const [sku, count] of skuCounts) {
    if (count > 1) errors.push(`El SKU ${sku} se repite en ${count} filas.`);
  }
  if (draft.wholesale_minimum && !(integerOrNull(draft.wholesale_minimum) >= 1)) {
    errors.push('La cantidad de mayoreo debe ser un entero positivo.');
  }
  if (draft.include_box) {
    if (!clean(draft.box_name)) errors.push('Indica el nombre de la caja.');
    if (!(numberOrNull(draft.box_quantity) > 0)) errors.push('Las presentaciones por caja deben ser mayores a cero.');
    if (!(numberOrNull(draft.box_price) >= 0)) errors.push('El precio de caja no puede ser negativo.');
  }
  for (const row of enabledRows) {
    if (!row.line_id && !row.color_id && !row.size_id && !row.finish && !clean(row.sku)) {
      errors.push(`${row.label}: una variante simple necesita SKU.`);
    }
    if (!(numberOrNull(row.contained_quantity) > 0)) {
      errors.push(`${row.label}: contenido invalido.`);
    }
    if (!(numberOrNull(row.base_price) >= 0)) errors.push(`${row.label}: precio invalido.`);
    if (draft.location_id && !(numberOrNull(row.inventory_quantity) >= 0)) {
      errors.push(`${row.label}: existencia invalida.`);
    }
  }
  return [...new Set(errors)];
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let quoted = false;
  const source = String(text ?? '').replace(/^\uFEFF/, '');

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        field += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ',') {
      row.push(field);
      field = '';
    } else if (character === '\n') {
      row.push(field.replace(/\r$/, ''));
      if (row.some((value) => clean(value))) rows.push(row);
      row = [];
      field = '';
    } else {
      field += character;
    }
  }
  row.push(field.replace(/\r$/, ''));
  if (row.some((value) => clean(value))) rows.push(row);
  return rows;
}

function csvValue(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function stringifyCsv(rows) {
  return rows.map((row) => row.map(csvValue).join(',')).join('\r\n');
}

function exportRecord(product, variant, presentation, tier, inventory) {
  const contained = presentation.contains_presentation_id
    ? variant.presentations.find((item) => item.id === presentation.contains_presentation_id)
    : null;
  return {
    producto: product.name,
    slug: product.slug,
    categoria: product.category?.name ?? '',
    subcategoria: '',
    marca: product.brand?.name ?? '',
    gama: variant.line?.slug ?? variant.line?.name ?? '',
    color_exacto: variant.color?.slug ?? variant.color?.exact_name ?? '',
    familia_color: variant.color?.family?.name ?? '',
    codigo_color: variant.color?.internal_code ?? '',
    medida: variant.size?.slug ?? variant.size?.name ?? '',
    acabado: variant.finish ?? '',
    sku_variante: variant.sku ?? '',
    codigo_barras_variante: variant.barcode ?? '',
    presentacion: presentation.name,
    tipo_presentacion: presentation.presentation_type,
    cantidad_contenida: presentation.contained_quantity ?? '',
    unidad_contenida: presentation.contained_unit ?? '',
    presentacion_contenida: contained?.name ?? '',
    cantidad_presentaciones: presentation.contains_quantity ?? '',
    unidades_base_totales: presentation.base_units_total,
    precio_normal: presentation.base_price,
    mayoreo_desde: tier?.minimum_quantity ?? '',
    mayoreo_hasta: tier?.maximum_quantity ?? '',
    precio_mayoreo: tier?.price_per_presentation ?? '',
    politica_inventario: variant.inventory_policy,
    sucursal: inventory?.location?.slug ?? inventory?.location?.name ?? '',
    existencia: inventory?.quantity ?? '',
    reservado: inventory?.reserved_quantity ?? '',
    imagen: variant.image_url ?? '',
    activo: variant.active !== false && presentation.active !== false ? 'si' : 'no',
  };
}

export function exportProductCsv(product) {
  const records = [];
  for (const variant of product?.variants ?? []) {
    for (const presentation of variant.presentations ?? []) {
      const tiers = presentation.tiers?.length ? presentation.tiers : [null];
      const matchingInventory = (variant.inventory ?? []).filter((row) =>
        row.sale_presentation_id == null || row.sale_presentation_id === presentation.id);
      const inventoryRows = matchingInventory.length ? matchingInventory : [null];
      for (const tier of tiers) {
        for (const inventory of inventoryRows) {
          records.push(exportRecord(product, variant, presentation, tier, inventory));
        }
      }
    }
  }
  const body = records.map((record) => BULK_CSV_COLUMNS.map((column) => record[column]));
  return stringifyCsv([BULK_CSV_COLUMNS, ...body]);
}

export function createProductCsvTemplate(product) {
  return stringifyCsv([
    BULK_CSV_COLUMNS,
    [
      product?.name ?? '',
      product?.slug ?? '',
      product?.category?.name ?? '',
      '',
      product?.brand?.name ?? '',
      'pastel',
      'rosa-pastel',
      '',
      '',
      '12-pulgadas',
      '',
      'SKU-EJEMPLO',
      '',
      'Bolsa',
      'bolsa',
      '100',
      'pieza',
      '',
      '',
      '100',
      '95',
      '12',
      '',
      '88',
      'shared_base_units',
      '',
      '',
      '',
      '',
      'si',
    ],
  ]);
}

function rowObject(headers, values) {
  return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? '']));
}

export function previewProductCsv(csvText, { product, lookups }) {
  const parsed = parseCsv(csvText);
  if (parsed.length < 2) return { rows: [], errors: ['El CSV no contiene filas de datos.'] };
  const headers = parsed[0].map((header) => comparable(header).replace(/-/g, '_'));
  const missing = ['slug', 'presentacion', 'tipo_presentacion', 'unidades_base_totales', 'precio_normal']
    .filter((column) => !headers.includes(column));
  if (missing.length) {
    return { rows: [], errors: [`Faltan columnas obligatorias: ${missing.join(', ')}.`] };
  }

  const rows = parsed.slice(1).map((values, index) => {
    const source = rowObject(headers, values);
    const errors = [];
    const line = findLookup(lookups.lines, source.gama, ['id', 'slug', 'name']);
    const color = findLookup(lookups.colors, source.color_exacto, ['id', 'slug', 'exact_name']);
    const size = findLookup(lookups.sizes, source.medida, ['id', 'slug', 'name']);
    const location = findLookup(lookups.locations, source.sucursal, ['id', 'slug', 'name']);
    if (comparable(source.slug) !== comparable(product.slug)) {
      errors.push(`El slug debe ser ${product.slug}.`);
    }
    if (source.gama && !line) errors.push(`Gama desconocida: ${source.gama}.`);
    if (source.color_exacto && !color) errors.push(`Color desconocido: ${source.color_exacto}.`);
    if (source.medida && !size) errors.push(`Medida desconocida: ${source.medida}.`);
    if (source.sucursal && !location) errors.push(`Sucursal desconocida: ${source.sucursal}.`);

    const variantIdentity = {
      line_id: line?.id ?? null,
      color_id: color?.id ?? null,
      size_id: size?.id ?? null,
      finish: nullable(source.acabado),
    };
    const existingVariant = findVariant(product, variantIdentity);
    if (
      !variantIdentity.line_id
      && !variantIdentity.color_id
      && !variantIdentity.size_id
      && !variantIdentity.finish
      && !clean(source.sku_variante)
    ) {
      errors.push('Una variante simple necesita SKU.');
    }

    const composed = Boolean(clean(source.presentacion_contenida));
    const baseUnits = numberOrNull(source.unidades_base_totales);
    const basePrice = numberOrNull(source.precio_normal);
    const containedQuantity = numberOrNull(source.cantidad_contenida);
    const containsQuantity = numberOrNull(source.cantidad_presentaciones);
    if (!clean(source.presentacion)) errors.push('Falta la presentacion.');
    if (!PRESENTATION_TYPES.has(clean(source.tipo_presentacion))) {
      errors.push(`Tipo de presentacion desconocido: ${source.tipo_presentacion}.`);
    }
    if (!(baseUnits > 0)) errors.push('Las unidades base deben ser mayores a cero.');
    if (!(basePrice >= 0)) errors.push('El precio normal no puede ser negativo.');
    if (composed && !(containsQuantity > 0)) {
      errors.push('La cantidad de presentaciones debe ser mayor a cero.');
    }
    if (!composed && !(containedQuantity > 0)) {
      errors.push('La cantidad contenida debe ser mayor a cero.');
    }

    const wholesaleMinimum = integerOrNull(source.mayoreo_desde);
    const wholesaleMaximum = integerOrNull(source.mayoreo_hasta);
    const wholesalePrice = numberOrNull(source.precio_mayoreo);
    if (source.mayoreo_desde && !(wholesaleMinimum >= 1)) errors.push('Mayoreo desde es invalido.');
    if (source.precio_mayoreo && !(wholesalePrice >= 0)) errors.push('El precio de mayoreo es invalido.');
    if (
      wholesaleMaximum != null
      && wholesaleMinimum != null
      && wholesaleMaximum < wholesaleMinimum
    ) errors.push('Mayoreo hasta no puede ser menor que mayoreo desde.');

    const inventoryQuantity = numberOrNull(source.existencia);
    const reservedQuantity = numberOrNull(source.reservado) ?? 0;
    if (source.existencia && !(inventoryQuantity >= 0)) errors.push('La existencia es invalida.');
    if (reservedQuantity < 0 || (inventoryQuantity != null && reservedQuantity > inventoryQuantity)) {
      errors.push('La reserva no puede superar la existencia.');
    }
    const existingPresentation = existingVariant?.presentations?.find(
      (presentation) => comparable(presentation.name) === comparable(source.presentacion),
    );

    return {
      lineNumber: index + 2,
      source,
      errors,
      valid: errors.length === 0,
      action: existingPresentation ? 'actualizar' : 'crear',
      payload: {
        row_key: `csv-${index + 2}`,
        variant: {
          id: existingVariant?.id ?? null,
          ...variantIdentity,
          sku: nullable(source.sku_variante),
          barcode: nullable(source.codigo_barras_variante),
          image_url: nullable(source.imagen),
          inventory_policy: source.politica_inventario === 'separate_by_presentation'
            ? 'separate_by_presentation'
            : 'shared_base_units',
          active: booleanValue(source.activo),
        },
        presentation: {
          id: existingPresentation?.id ?? null,
          name: clean(source.presentacion),
          presentation_type: clean(source.tipo_presentacion) || 'otro',
          base_unit: clean(source.unidad_contenida) || 'pieza',
          contained_quantity: composed ? null : containedQuantity,
          contained_unit: composed ? null : clean(source.unidad_contenida) || 'pieza',
          contains_presentation_name: composed ? clean(source.presentacion_contenida) : null,
          contains_quantity: composed ? containsQuantity : null,
          base_units_total: baseUnits,
          base_price: basePrice,
          minimum_order_quantity: 1,
          quantity_step: 1,
          inventory_policy: null,
          active: booleanValue(source.activo),
        },
        tier: wholesaleMinimum != null && wholesalePrice != null
          ? {
            minimum_quantity: wholesaleMinimum,
            maximum_quantity: wholesaleMaximum,
            price_per_presentation: wholesalePrice,
            label: 'Mayoreo',
            active: true,
          }
          : null,
        inventory: location && inventoryQuantity != null
          ? {
            location_id: location.id,
            quantity: inventoryQuantity,
            reserved_quantity: reservedQuantity,
          }
          : null,
        box: null,
      },
    };
  });

  return {
    rows,
    errors: [],
    validCount: rows.filter((row) => row.valid).length,
    rejectedCount: rows.filter((row) => !row.valid).length,
  };
}
