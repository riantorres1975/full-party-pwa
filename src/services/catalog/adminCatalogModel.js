const COMMON_FIELDS = [
  { name: 'name', label: 'Nombre', type: 'text', required: true },
  { name: 'slug', label: 'Slug', type: 'slug', required: true },
];

const SORT_ACTIVE_FIELDS = [
  { name: 'sort_order', label: 'Orden', type: 'number', defaultValue: 0 },
  { name: 'active', label: 'Visible', type: 'boolean', defaultValue: true },
];

export const ADMIN_CATALOG_GROUPS = [
  {
    id: 'structure',
    label: 'Estructura',
    description: 'Organiza la navegacion publica.',
    resources: ['categories', 'collections', 'brands'],
  },
  {
    id: 'variants',
    label: 'Variantes',
    description: 'Define gamas, colores y medidas reales.',
    resources: ['lines', 'colorFamilies', 'colors', 'sizes'],
  },
  {
    id: 'operations',
    label: 'Operacion',
    description: 'Atributos y sucursales del catalogo.',
    resources: ['attributes', 'locations'],
  },
];

export const ADMIN_CATALOG_RESOURCES = {
  categories: {
    table: 'catalog_categories',
    label: 'Categorias',
    singular: 'categoria',
    article: 'Nueva',
    nameField: 'name',
    description: 'Jerarquia principal y subcategorias del catalogo.',
    icon: 'folders',
    orderBy: ['sort_order', 'name'],
    fields: [
      ...COMMON_FIELDS,
      {
        name: 'parent_id',
        label: 'Categoria superior',
        type: 'relation',
        resource: 'categories',
        nullable: true,
      },
      { name: 'description', label: 'Descripcion', type: 'textarea', nullable: true },
      { name: 'image_url', label: 'Imagen', type: 'url', nullable: true },
      { name: 'icon', label: 'Icono', type: 'text', nullable: true },
      ...SORT_ACTIVE_FIELDS,
    ],
  },
  collections: {
    table: 'catalog_collections',
    label: 'Colecciones',
    singular: 'coleccion',
    article: 'Nueva',
    nameField: 'name',
    description: 'Eventos, temporadas y agrupaciones editoriales.',
    icon: 'sparkles',
    orderBy: ['sort_order', 'name'],
    fields: [
      ...COMMON_FIELDS,
      { name: 'description', label: 'Descripcion', type: 'textarea', nullable: true },
      {
        name: 'collection_type',
        label: 'Tipo',
        type: 'select',
        required: true,
        defaultValue: 'editorial',
        options: [
          { value: 'editorial', label: 'Editorial' },
          { value: 'evento', label: 'Evento' },
          { value: 'temporada', label: 'Temporada' },
          { value: 'color', label: 'Color' },
        ],
      },
      { name: 'image_url', label: 'Imagen', type: 'url', nullable: true },
      { name: 'start_date', label: 'Inicio', type: 'datetime-local', nullable: true },
      { name: 'end_date', label: 'Fin', type: 'datetime-local', nullable: true },
      ...SORT_ACTIVE_FIELDS,
    ],
  },
  brands: {
    table: 'catalog_brands',
    label: 'Marcas',
    singular: 'marca',
    article: 'Nueva',
    nameField: 'name',
    description: 'Fabricantes y marcas comerciales.',
    icon: 'badge',
    orderBy: ['sort_order', 'name'],
    fields: [
      ...COMMON_FIELDS,
      { name: 'logo_url', label: 'Logotipo', type: 'url', nullable: true },
      { name: 'description', label: 'Descripcion', type: 'textarea', nullable: true },
      ...SORT_ACTIVE_FIELDS,
    ],
  },
  lines: {
    table: 'catalog_product_lines',
    label: 'Gamas',
    singular: 'gama',
    article: 'Nueva',
    nameField: 'name',
    description: 'Lineas como Estandar, Pastel, Chrome o Neon.',
    icon: 'layers',
    orderBy: ['sort_order', 'name'],
    fields: [
      ...COMMON_FIELDS,
      {
        name: 'brand_id',
        label: 'Marca',
        type: 'relation',
        resource: 'brands',
        required: true,
      },
      { name: 'finish_type', label: 'Acabado', type: 'text', nullable: true },
      { name: 'description', label: 'Descripcion', type: 'textarea', nullable: true },
      { name: 'image_url', label: 'Imagen', type: 'url', nullable: true },
      ...SORT_ACTIVE_FIELDS,
    ],
  },
  colorFamilies: {
    table: 'catalog_color_families',
    label: 'Familias de color',
    singular: 'familia de color',
    article: 'Nueva',
    nameField: 'name',
    description: 'Agrupa tonos exactos bajo Rosa, Azul, Dorado y otros.',
    icon: 'palette',
    orderBy: ['sort_order', 'name'],
    fields: [...COMMON_FIELDS, ...SORT_ACTIVE_FIELDS],
  },
  colors: {
    table: 'catalog_colors',
    label: 'Colores exactos',
    singular: 'color',
    article: 'Nuevo',
    nameField: 'exact_name',
    description: 'Tonos comerciales exactos disponibles en variantes.',
    icon: 'droplets',
    orderBy: ['exact_name'],
    fields: [
      { name: 'exact_name', label: 'Nombre exacto', type: 'text', required: true },
      { name: 'slug', label: 'Slug', type: 'slug', required: true },
      {
        name: 'color_family_id',
        label: 'Familia de color',
        type: 'relation',
        resource: 'colorFamilies',
        required: true,
      },
      { name: 'hex_value', label: 'Color HEX', type: 'color', nullable: true },
      { name: 'swatch_image_url', label: 'Muestra de color', type: 'url', nullable: true },
      { name: 'internal_code', label: 'Codigo interno', type: 'text', nullable: true },
      { name: 'active', label: 'Visible', type: 'boolean', defaultValue: true },
    ],
  },
  sizes: {
    table: 'catalog_sizes',
    label: 'Medidas',
    singular: 'medida',
    article: 'Nueva',
    nameField: 'name',
    description: 'Medidas numericas y nombres comerciales.',
    icon: 'ruler',
    orderBy: ['sort_order', 'name'],
    fields: [
      { name: 'name', label: 'Nombre comercial', type: 'text', required: true },
      { name: 'numeric_value', label: 'Valor numerico', type: 'number', nullable: true, step: '0.001' },
      {
        name: 'unit',
        label: 'Unidad',
        type: 'select',
        required: true,
        defaultValue: 'pulgada',
        options: [
          { value: 'pulgada', label: 'Pulgadas' },
          { value: 'cm', label: 'Centimetros' },
          { value: 'm', label: 'Metros' },
          { value: 'ml', label: 'Mililitros' },
          { value: 'l', label: 'Litros' },
          { value: 'g', label: 'Gramos' },
          { value: 'kg', label: 'Kilogramos' },
          { value: 'comercial', label: 'Medida comercial' },
          { value: 'otro', label: 'Otra' },
        ],
      },
      ...SORT_ACTIVE_FIELDS,
    ],
  },
  attributes: {
    table: 'catalog_attributes',
    label: 'Atributos',
    singular: 'atributo',
    article: 'Nuevo',
    nameField: 'name',
    description: 'Caracteristicas filtrables para productos no especializados.',
    icon: 'sliders',
    orderBy: ['sort_order', 'name'],
    fields: [
      ...COMMON_FIELDS,
      {
        name: 'data_type',
        label: 'Tipo de dato',
        type: 'select',
        required: true,
        defaultValue: 'text',
        options: [
          { value: 'text', label: 'Texto' },
          { value: 'number', label: 'Numero' },
          { value: 'boolean', label: 'Si / no' },
        ],
      },
      { name: 'filterable', label: 'Usar como filtro', type: 'boolean', defaultValue: true },
      { name: 'variant_level', label: 'Define variante', type: 'boolean', defaultValue: true },
      ...SORT_ACTIVE_FIELDS,
    ],
  },
  locations: {
    table: 'catalog_locations',
    label: 'Sucursales',
    singular: 'sucursal',
    article: 'Nueva',
    nameField: 'name',
    description: 'Ubicaciones disponibles para inventario.',
    icon: 'store',
    orderBy: ['name'],
    fields: [
      ...COMMON_FIELDS,
      { name: 'active', label: 'Activa', type: 'boolean', defaultValue: true },
    ],
  },
};

const NUMERIC_FIELDS = new Set(['sort_order', 'numeric_value']);
const BOOLEAN_FIELDS = new Set(['active', 'filterable', 'variant_level']);
const NULLABLE_FIELDS = new Set([
  'parent_id',
  'description',
  'image_url',
  'icon',
  'logo_url',
  'finish_type',
  'start_date',
  'end_date',
  'hex_value',
  'swatch_image_url',
  'internal_code',
  'numeric_value',
]);
const NUMERIC_SIZE_UNITS = new Set(['pulgada', 'cm', 'm', 'ml', 'l', 'g', 'kg']);

export function getAdminCatalogResource(resourceKey) {
  return ADMIN_CATALOG_RESOURCES[resourceKey] ?? null;
}

export function slugifyCatalogValue(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function createAdminCatalogDraft(resourceKey) {
  const resource = getAdminCatalogResource(resourceKey);
  if (!resource) return {};

  return Object.fromEntries(
    resource.fields.map((field) => [
      field.name,
      field.defaultValue ?? (field.type === 'boolean' ? false : ''),
    ]),
  );
}

export function normalizeAdminCatalogPayload(resourceKey, input) {
  const resource = getAdminCatalogResource(resourceKey);
  if (!resource) throw new Error(`Recurso administrativo desconocido: ${resourceKey}`);

  const payload = {};
  for (const field of resource.fields) {
    let value = input?.[field.name];

    if (field.name === 'slug' && !String(value ?? '').trim()) {
      value = slugifyCatalogValue(input?.[resource.nameField]);
    }

    if (BOOLEAN_FIELDS.has(field.name)) {
      payload[field.name] = value === true;
      continue;
    }

    if (NUMERIC_FIELDS.has(field.name)) {
      if (value === '' || value == null) {
        payload[field.name] = field.name === 'sort_order' ? 0 : null;
      } else {
        const number = Number(value);
        payload[field.name] = Number.isFinite(number) ? number : null;
      }
      continue;
    }

    if (typeof value === 'string') value = value.trim();
    payload[field.name] = NULLABLE_FIELDS.has(field.name) && !value ? null : value;
  }

  if (payload.slug) payload.slug = slugifyCatalogValue(payload.slug);
  if (payload.hex_value) payload.hex_value = payload.hex_value.toUpperCase();
  if (payload.start_date) payload.start_date = new Date(payload.start_date).toISOString();
  if (payload.end_date) payload.end_date = new Date(payload.end_date).toISOString();

  return payload;
}

export function validateAdminCatalogPayload(resourceKey, input, { entityId = null } = {}) {
  const resource = getAdminCatalogResource(resourceKey);
  if (!resource) return { valid: false, errors: { form: 'Recurso desconocido.' } };

  const payload = normalizeAdminCatalogPayload(resourceKey, input);
  const errors = {};

  for (const field of resource.fields) {
    if (field.required && (payload[field.name] === '' || payload[field.name] == null)) {
      errors[field.name] = `${field.label} es obligatorio.`;
    }
  }

  if (payload.slug && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(payload.slug)) {
    errors.slug = 'Usa letras minusculas, numeros y guiones.';
  }
  if (payload.parent_id && payload.parent_id === entityId) {
    errors.parent_id = 'Una categoria no puede depender de si misma.';
  }
  if (payload.hex_value && !/^#[0-9A-F]{6}$/.test(payload.hex_value)) {
    errors.hex_value = 'Usa un color HEX de seis digitos.';
  }
  if (payload.start_date && payload.end_date && payload.end_date < payload.start_date) {
    errors.end_date = 'La fecha final debe ser posterior a la inicial.';
  }
  if (
    resourceKey === 'sizes' &&
    NUMERIC_SIZE_UNITS.has(payload.unit) &&
    !(payload.numeric_value > 0)
  ) {
    errors.numeric_value = 'Captura un valor mayor que cero para esta unidad.';
  }

  return { valid: Object.keys(errors).length === 0, errors, payload };
}

export function getAdminCatalogRowTitle(resourceKey, row) {
  const resource = getAdminCatalogResource(resourceKey);
  return resource ? String(row?.[resource.nameField] ?? '') : '';
}
