export const CATEGORY_ROUTE_RULES = [
  { slug: 'globos-latex', label: 'Globos de Látex', groups: [['globo latex']] },
  { slug: 'globos-numero', aliases: ['globos-numeros'], label: 'Globos de Número', groups: [['globo numero']] },
  { slug: 'globos-foil', label: 'Globos Foil', groups: [['foil'], ['orbz']] },
  { slug: 'letras-foil', label: 'Letras Foil', groups: [['letra', 'foil']] },
  { slug: 'globos-personajes', aliases: ['personajes'], label: 'Globos de Personajes', groups: [['personaje']] },
  { slug: 'globos-cumpleanos', label: 'Globos de Cumpleaños', groups: [['cumple'], ['happy birthday']] },
  { slug: 'globos-graduacion', label: 'Globos de Graduación', groups: [['gradua']] },
  { slug: 'globos-helio', label: 'Globos para Helio', groups: [['helio']] },
  { slug: 'sets-globos', label: 'Sets de Globos', groups: [['set', 'globo'], ['kit', 'globo']] },
  { slug: 'guirnaldas', label: 'Guirnaldas', groups: [['guirnalda']] },
  { slug: 'cortinas-lluvia', label: 'Cortinas de Lluvia', groups: [['cortina']] },
  { slug: 'velas', label: 'Velas', groups: [['vela']] },
  {
    slug: 'accesorios-globos',
    label: 'Accesorios para Globos',
    groups: [['accesorio', 'globo'], ['inflador'], ['infladora'], ['bomba', 'globo']],
  },
  { slug: 'letras-led', label: 'Letras LED', groups: [['letra', 'led']] },
  { slug: 'globos-revelacion', label: 'Globos de Revelación', groups: [['revelacion']] },
  { slug: 'bazucas-confeti', label: 'Bazucas de Confeti', groups: [['bazuca', 'confeti']] },
  { slug: 'cortinas-guirnaldas', label: 'Cortinas y Guirnaldas', groups: [['cortina'], ['guirnalda']] },
  {
    slug: 'sets-accesorios',
    label: 'Sets y Accesorios',
    groups: [['set', 'globo'], ['kit', 'globo'], ['accesorio'], ['inflador'], ['infladora'], ['bomba', 'globo'], ['cinta'], ['liston']],
  },
  { slug: 'brillo-acabados', label: 'Brillo y Acabados', groups: [['brillo'], ['shine'], ['acabado']] },
];

function normalizeText(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function slugifyCategory(value) {
  return normalizeText(value).replace(/\s+/g, '-');
}

function getProductRouteText(product) {
  return normalizeText([
    product?.categoria,
    product?.nombre,
    product?.descripcion,
    product?.marca,
  ].filter(Boolean).join(' '));
}

function matchesGroups(product, groups) {
  const text = getProductRouteText(product);
  return groups.some((terms) => terms.every((term) => text.includes(term)));
}

function uniqueCategories(products) {
  return [...new Set(products.map((product) => product?.categoria).filter(Boolean))];
}

export function resolveCategoryRoute(rawSlug, products = []) {
  const requestedSlug = slugifyCategory(rawSlug);
  if (!requestedSlug) return null;

  const rule = CATEGORY_ROUTE_RULES.find(({ slug, aliases = [] }) => (
    slug === requestedSlug || aliases.includes(requestedSlug)
  ));

  if (rule) {
    const matches = (product) => matchesGroups(product, rule.groups);
    return {
      requestedSlug,
      canonicalSlug: rule.slug,
      label: rule.label,
      categoryIds: uniqueCategories(products.filter(matches)),
      matches,
    };
  }

  const category = uniqueCategories(products).find((value) => slugifyCategory(value) === requestedSlug);
  if (!category) return null;

  const normalizedCategory = normalizeText(category);
  return {
    requestedSlug,
    canonicalSlug: requestedSlug,
    label: category,
    categoryIds: [category],
    matches: (product) => normalizeText(product?.categoria) === normalizedCategory,
  };
}
