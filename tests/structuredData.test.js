import assert from 'node:assert/strict';
import test from 'node:test';
import { buildRouteStructuredData } from '../src/utils/structuredData.js';

test('builds canonical breadcrumbs for a catalog category alias', () => {
  const data = buildRouteStructuredData('/catalogo/globos-numeros');
  const breadcrumb = data['@graph'][0];

  assert.equal(breadcrumb['@type'], 'BreadcrumbList');
  assert.deepEqual(
    breadcrumb.itemListElement.map(({ name, item }) => ({ name, item })),
    [
      { name: 'Full Party Uruapan', item: 'https://www.fullpartyuruapan.com.mx/' },
      { name: 'Catálogo', item: 'https://www.fullpartyuruapan.com.mx/catalogo' },
      { name: 'Globos de Número', item: 'https://www.fullpartyuruapan.com.mx/catalogo/globos-numero' },
    ],
  );
});

test('describes both physical stores on the branches route', () => {
  const data = buildRouteStructuredData('/sucursales');
  const stores = data['@graph'].filter((entry) => entry['@type'] === 'Store');

  assert.equal(stores.length, 2);
  assert.deepEqual(stores.map(({ telephone }) => telephone), ['+524525254596', '+524521040377']);
  assert.ok(stores.every((store) => store.address.addressLocality === 'Uruapan'));
  assert.ok(stores.every((store) => store.geo.latitude && store.geo.longitude));
  assert.equal(stores[1].openingHoursSpecification.length, 2);
});

test('does not publish route schemas on private or unknown pages', () => {
  assert.equal(buildRouteStructuredData('/'), null);
  assert.equal(buildRouteStructuredData('/admin/catalogo'), null);
  assert.equal(buildRouteStructuredData('/pagina-inexistente'), null);
});

test('describes configured catalog categories as collection pages', () => {
  const data = buildRouteStructuredData('/catalogo/infladora-de-globos', {
    category: {
      label: 'Bombas e infladores',
      description: 'Infla tus globos con menos esfuerzo.',
      imageUrl: '/productos/bomba.webp',
      count: 5,
    },
  });
  const collection = data['@graph'].find(({ '@type': type }) => type === 'CollectionPage');

  assert.equal(collection.name, 'Bombas e infladores');
  assert.equal(collection.mainEntity.numberOfItems, 5);
  assert.equal(
    collection.primaryImageOfPage.url,
    'https://www.fullpartyuruapan.com.mx/productos/bomba.webp',
  );
});
