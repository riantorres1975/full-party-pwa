import test from 'node:test';
import assert from 'node:assert/strict';
import {
  adaptAdminInventoryRow,
} from '../src/services/catalog/inventoryModel.js';
import {
  adaptCancellationResult,
  adaptFulfillmentItems,
  adaptFulfillmentResult,
} from '../src/services/catalog/orderLifecycleModel.js';

test('adapts V2 inventory with reserved and available quantities', () => {
  const result = adaptAdminInventoryRow({
    id: 'inventory-1',
    variant_id: 'variant-1',
    quantity: '1200',
    reserved_quantity: '200',
    low_stock_threshold: '150',
    location: { name: 'Uruapan Centro' },
    presentation: null,
    variant: {
      image_url: '/red.png',
      product: {
        name: 'Globo Latex',
        category: { name: 'Globos' },
        brand: { name: 'Glomex' },
      },
      line: { name: 'Estandar' },
      color: { exact_name: 'Rojo' },
      size: { name: '12 pulgadas' },
    },
  });

  assert.equal(result.nombre, 'Globo Latex Estandar Rojo 12 pulgadas');
  assert.equal(result.presentacion, 'Unidad base');
  assert.equal(result.ubicacion, 'Uruapan Centro');
  assert.equal(result.stock_actual, 1200);
  assert.equal(result.stock_reservado, 200);
  assert.equal(result.stock_disponible, 1000);
  assert.equal(result.stock_minimo, 150);
});

test('fulfillment keeps only canonical V2 identifiers and quantities', () => {
  const items = adaptFulfillmentItems([{
    variant_id: 'variant-1',
    sale_presentation_id: 'presentation-1',
    cantidad_surtida: 1,
    nombre: 'Ignored snapshot name',
  }]);
  assert.deepEqual(items, [{
    variant_id: 'variant-1',
    sale_presentation_id: 'presentation-1',
    quantity: 1,
  }]);

  const result = adaptFulfillmentResult({
    folio: 'FP-TEST123',
    total: '78',
    details: [{ inventory_state: 'committed' }],
    replay: false,
  });
  assert.equal(result.total, 78);
  assert.equal(result.details[0].inventory_state, 'committed');
});

test('cancellation normalizes the atomic inventory RPC result', () => {
  const result = adaptCancellationResult({
    folio: 'FP-CANCEL1',
    details: [{ inventory_state: 'released' }],
    cancelled_at: '2026-07-28T18:00:00Z',
    replay: true,
  });
  assert.equal(result.cancelledAt, '2026-07-28T18:00:00Z');
  assert.equal(result.details[0].inventory_state, 'released');
  assert.equal(result.replay, true);
});
