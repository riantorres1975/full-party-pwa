const PLACEHOLDER_IMAGE_PATTERN = /(?:^|\/\/)(?:www\.)?placehold\.co\//i;

export const CATALOG_QUALITY_ISSUES = {
  MISSING_IMAGE: 'missing_image',
  MISSING_DESCRIPTION: 'missing_description',
  MISSING_CATEGORY: 'missing_category',
  MISSING_BRAND: 'missing_brand',
  INVALID_PRICE: 'invalid_price',
  INVALID_STOCK: 'invalid_stock',
  DUPLICATE_NAME: 'duplicate_name',
  DUPLICATE_IMAGE: 'duplicate_image',
};

export const BLOCKING_CATALOG_ISSUES = new Set([
  CATALOG_QUALITY_ISSUES.MISSING_IMAGE,
  CATALOG_QUALITY_ISSUES.MISSING_DESCRIPTION,
  CATALOG_QUALITY_ISSUES.MISSING_CATEGORY,
  CATALOG_QUALITY_ISSUES.INVALID_PRICE,
  CATALOG_QUALITY_ISSUES.INVALID_STOCK,
]);

const COMPLETENESS_ISSUES = [
  CATALOG_QUALITY_ISSUES.MISSING_IMAGE,
  CATALOG_QUALITY_ISSUES.MISSING_DESCRIPTION,
  CATALOG_QUALITY_ISSUES.MISSING_CATEGORY,
  CATALOG_QUALITY_ISSUES.MISSING_BRAND,
  CATALOG_QUALITY_ISSUES.INVALID_PRICE,
  CATALOG_QUALITY_ISSUES.INVALID_STOCK,
];

function cleanText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function normalizeCatalogDuplicateValue(value) {
  return cleanText(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function normalizeImageUrl(value) {
  const cleanUrl = cleanText(value);
  if (!cleanUrl || PLACEHOLDER_IMAGE_PATTERN.test(cleanUrl)) return '';

  try {
    const url = new URL(cleanUrl);
    url.hash = '';
    url.search = '';
    return url.toString().replace(/\/+$/, '').toLowerCase();
  } catch {
    return cleanUrl.split(/[?#]/, 1)[0].replace(/\/+$/, '').toLowerCase();
  }
}

export function isPlaceholderProductImage(value) {
  const cleanUrl = cleanText(value);
  return !cleanUrl || PLACEHOLDER_IMAGE_PATTERN.test(cleanUrl);
}

export function getPublishingBlockers(product = {}) {
  const issues = [];
  const price = Number(product.precio);

  if (isPlaceholderProductImage(product.imagen_url)) {
    issues.push(CATALOG_QUALITY_ISSUES.MISSING_IMAGE);
  }
  if (!cleanText(product.descripcion)) {
    issues.push(CATALOG_QUALITY_ISSUES.MISSING_DESCRIPTION);
  }
  if (!cleanText(product.categoria)) {
    issues.push(CATALOG_QUALITY_ISSUES.MISSING_CATEGORY);
  }
  if (!Number.isFinite(price) || price <= 0) {
    issues.push(CATALOG_QUALITY_ISSUES.INVALID_PRICE);
  }
  if (
    product.stock_ilimitado === false
    && (
      product.stock_actual === null
      || product.stock_actual === undefined
      || product.stock_actual === ''
      || !Number.isFinite(Number(product.stock_actual))
      || Number(product.stock_actual) < 0
    )
  ) {
    issues.push(CATALOG_QUALITY_ISSUES.INVALID_STOCK);
  }

  return issues;
}

function addGroupValue(groups, value, id) {
  if (!value || !id) return;
  const ids = groups.get(value) || [];
  ids.push(id);
  groups.set(value, ids);
}

export function analyzeCatalogQuality(products = []) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];
  const nameGroups = new Map();
  const imageGroups = new Map();

  safeProducts.forEach((product) => {
    const id = String(product.id ?? '');
    addGroupValue(nameGroups, normalizeCatalogDuplicateValue(product.nombre), id);
    addGroupValue(imageGroups, normalizeImageUrl(product.imagen_url), id);
  });

  const duplicateNameIds = new Set(
    [...nameGroups.values()].filter((ids) => ids.length > 1).flat(),
  );
  const duplicateImageIds = new Set(
    [...imageGroups.values()].filter((ids) => ids.length > 1).flat(),
  );
  const issueCounts = Object.fromEntries(
    Object.values(CATALOG_QUALITY_ISSUES).map((issue) => [issue, 0]),
  );
  const byId = new Map();
  let totalScore = 0;
  let completeCount = 0;
  let readyCount = 0;
  let duplicateCount = 0;

  safeProducts.forEach((product) => {
    const id = String(product.id ?? '');
    const issues = getPublishingBlockers(product);

    if (!cleanText(product.marca)) {
      issues.push(CATALOG_QUALITY_ISSUES.MISSING_BRAND);
    }
    if (duplicateNameIds.has(id)) {
      issues.push(CATALOG_QUALITY_ISSUES.DUPLICATE_NAME);
    }
    if (duplicateImageIds.has(id)) {
      issues.push(CATALOG_QUALITY_ISSUES.DUPLICATE_IMAGE);
    }

    const uniqueIssues = [...new Set(issues)];
    const blockers = uniqueIssues.filter((issue) => BLOCKING_CATALOG_ISSUES.has(issue));
    const missingFields = COMPLETENESS_ISSUES.filter((issue) => uniqueIssues.includes(issue));
    const score = Math.round(
      ((COMPLETENESS_ISSUES.length - missingFields.length) / COMPLETENESS_ISSUES.length) * 100,
    );
    const hasDuplicates = uniqueIssues.includes(CATALOG_QUALITY_ISSUES.DUPLICATE_NAME)
      || uniqueIssues.includes(CATALOG_QUALITY_ISSUES.DUPLICATE_IMAGE);

    uniqueIssues.forEach((issue) => {
      issueCounts[issue] += 1;
    });
    totalScore += score;
    if (missingFields.length === 0) completeCount += 1;
    if (blockers.length === 0) readyCount += 1;
    if (hasDuplicates) duplicateCount += 1;

    byId.set(id, {
      score,
      issues: uniqueIssues,
      blockers,
      isComplete: missingFields.length === 0,
      isReadyToPublish: blockers.length === 0,
      hasDuplicates,
    });
  });

  const total = safeProducts.length;
  return {
    byId,
    issueCounts,
    summary: {
      total,
      averageScore: total > 0 ? Math.round(totalScore / total) : 100,
      completeCount,
      incompleteCount: total - completeCount,
      readyCount,
      blockedCount: total - readyCount,
      duplicateCount,
    },
  };
}

export function buildCatalogCorrectionQueue(products = [], qualityById = new Map()) {
  const safeProducts = Array.isArray(products) ? products.filter(Boolean) : [];

  return safeProducts
    .filter((product) => {
      const quality = qualityById.get(String(product.id));
      return quality && (!quality.isComplete || quality.hasDuplicates);
    })
    .sort((productA, productB) => {
      const qualityA = qualityById.get(String(productA.id));
      const qualityB = qualityById.get(String(productB.id));
      const blockerDifference = qualityB.blockers.length - qualityA.blockers.length;
      if (blockerDifference !== 0) return blockerDifference;

      const issueDifference = qualityB.issues.length - qualityA.issues.length;
      if (issueDifference !== 0) return issueDifference;

      const scoreDifference = qualityA.score - qualityB.score;
      if (scoreDifference !== 0) return scoreDifference;

      return String(productA.nombre || '').localeCompare(
        String(productB.nombre || ''),
        'es',
        { sensitivity: 'base' },
      );
    });
}
