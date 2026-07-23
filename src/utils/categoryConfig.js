export const CATEGORY_CONFIG_KEY = 'catalogo_categorias';
export const CATEGORY_CONFIG_VERSION = 1;

const MAX_CATEGORY_ITEMS = 250;
const MAX_CATEGORY_ID_LENGTH = 120;
const MAX_CATEGORY_LABEL_LENGTH = 80;
const MAX_CATEGORY_DESCRIPTION_LENGTH = 220;
const MAX_CATEGORY_IMAGE_URL_LENGTH = 2000;

function cleanText(value, maxLength) {
  return String(value || '').trim().slice(0, maxLength);
}

function cleanOrder(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : fallback;
}

export function normalizeCategoryConfig(value) {
  const source = Array.isArray(value) ? value : value?.items;
  if (!Array.isArray(source)) return [];

  const seen = new Set();
  const items = [];

  source.slice(0, MAX_CATEGORY_ITEMS).forEach((item, index) => {
    const id = cleanText(item?.id, MAX_CATEGORY_ID_LENGTH);
    if (!id || seen.has(id)) return;
    seen.add(id);

    items.push({
      id,
      label: cleanText(item?.label, MAX_CATEGORY_LABEL_LENGTH) || id,
      description: cleanText(item?.description, MAX_CATEGORY_DESCRIPTION_LENGTH),
      imageUrl: cleanText(item?.imageUrl, MAX_CATEGORY_IMAGE_URL_LENGTH),
      visible: item?.visible !== false,
      order: cleanOrder(item?.order, index),
    });
  });

  return items.sort((a, b) => a.order - b.order);
}

export function serializeCategoryConfig(items) {
  return {
    version: CATEGORY_CONFIG_VERSION,
    items: normalizeCategoryConfig(items).map((item, index) => ({
      ...item,
      order: index,
    })),
  };
}

export function mergeCategoryStats(categoryStats, configValue) {
  const configById = new Map(
    normalizeCategoryConfig(configValue).map((item) => [item.id, item]),
  );

  return (Array.isArray(categoryStats) ? categoryStats : [])
    .map((category, sourceIndex) => {
      const configured = configById.get(category.id);
      return {
        ...category,
        label: configured?.label || category.label || category.id,
        description: configured?.description || '',
        imagen: configured?.imageUrl || category.imagen || null,
        visible: configured?.visible !== false,
        order: configured ? configured.order : Number.MAX_SAFE_INTEGER,
        hasCustomLabel: Boolean(configured?.label && configured.label !== category.id),
        sourceIndex,
      };
    })
    .filter((category) => category.visible)
    .sort((a, b) => (
      a.order - b.order
      || a.sourceIndex - b.sourceIndex
    ))
    .map(({ sourceIndex: _sourceIndex, ...category }) => category);
}

export function buildCategoryDraft(categoryNames, products, configValue) {
  const configById = new Map(
    normalizeCategoryConfig(configValue).map((item) => [item.id, item]),
  );
  const firstImageByCategory = new Map();

  (Array.isArray(products) ? products : []).forEach((product) => {
    const category = cleanText(product?.categoria, MAX_CATEGORY_ID_LENGTH);
    const imageUrl = cleanText(product?.imagen_url, MAX_CATEGORY_IMAGE_URL_LENGTH);
    if (category && imageUrl && !firstImageByCategory.has(category)) {
      firstImageByCategory.set(category, imageUrl);
    }
  });

  return [...new Set((Array.isArray(categoryNames) ? categoryNames : [])
    .map((category) => cleanText(category, MAX_CATEGORY_ID_LENGTH))
    .filter(Boolean))]
    .map((id, sourceIndex) => {
      const configured = configById.get(id);
      return {
        id,
        label: configured?.label || id,
        description: configured?.description || '',
        imageUrl: configured?.imageUrl || '',
        fallbackImageUrl: firstImageByCategory.get(id) || '',
        visible: configured?.visible !== false,
        order: configured ? configured.order : Number.MAX_SAFE_INTEGER,
        sourceIndex,
      };
    })
    .sort((a, b) => (
      a.order - b.order
      || a.sourceIndex - b.sourceIndex
      || a.label.localeCompare(b.label, 'es', { sensitivity: 'base' })
    ))
    .map(({ sourceIndex: _sourceIndex, ...item }, index) => ({
      ...item,
      order: index,
    }));
}

function normalizeDraftItems(items) {
  const fallbackById = new Map(
    (Array.isArray(items) ? items : []).map((item) => [
      item?.id,
      cleanText(item?.fallbackImageUrl, MAX_CATEGORY_IMAGE_URL_LENGTH),
    ]),
  );

  return normalizeCategoryConfig(items).map((item) => ({
    ...item,
    fallbackImageUrl: fallbackById.get(item.id) || '',
  }));
}

export function moveCategory(items, categoryId, direction) {
  const normalized = normalizeDraftItems(items);
  const index = normalized.findIndex(({ id }) => id === categoryId);
  const targetIndex = index + Number(direction);
  if (index < 0 || targetIndex < 0 || targetIndex >= normalized.length) return normalized;

  const next = [...normalized];
  [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
  return next.map((item, order) => ({ ...item, order }));
}

export function renameCategoryConfig(items, previousId, nextId) {
  const cleanNextId = cleanText(nextId, MAX_CATEGORY_ID_LENGTH);
  if (!cleanNextId) return normalizeDraftItems(items);

  return normalizeDraftItems(items).map((item) => (
    item.id === previousId
      ? {
          ...item,
          id: cleanNextId,
          label: item.label === previousId ? cleanNextId : item.label,
        }
      : item
  ));
}

export function removeCategoryConfig(items, categoryId) {
  return normalizeDraftItems(items)
    .filter(({ id }) => id !== categoryId)
    .map((item, order) => ({ ...item, order }));
}
