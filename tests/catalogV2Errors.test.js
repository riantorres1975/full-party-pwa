import test from 'node:test';
import assert from 'node:assert/strict';

import {
  CATALOG_ERROR_TYPES,
  CatalogError,
  classifyCatalogError,
} from '../src/services/catalog/errors.js';

test('clasifica errores de inventario, validacion, permisos y pedidos', () => {
  assert.equal(
    classifyCatalogError(new Error('OUT_OF_STOCK: Faltan 2 bolsas')).type,
    CATALOG_ERROR_TYPES.OUT_OF_STOCK,
  );
  assert.equal(
    classifyCatalogError(new Error('INVALID_QUANTITY: bad step')).type,
    CATALOG_ERROR_TYPES.INVALID,
  );
  assert.equal(
    classifyCatalogError({ code: '42501', message: 'permission denied' }).type,
    CATALOG_ERROR_TYPES.PERMISSION,
  );
  assert.equal(
    classifyCatalogError(new Error('Orders are temporarily disabled')).type,
    CATALOG_ERROR_TYPES.ORDERS_DISABLED,
  );
});

test('marca red como reintentable y conserva CatalogError existente', () => {
  const network = classifyCatalogError(new TypeError('Failed to fetch'));
  assert.equal(network.type, CATALOG_ERROR_TYPES.NETWORK);
  assert.equal(network.retryable, true);

  const existing = new CatalogError(CATALOG_ERROR_TYPES.UNAVAILABLE, 'No disponible');
  assert.equal(classifyCatalogError(existing), existing);
});
