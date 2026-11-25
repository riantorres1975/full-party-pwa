import test from 'node:test';
import assert from 'node:assert/strict';
import { adaptAdminInventoryRow, parseStockAmount } from '../src/services/catalog/inventoryModel.js';

test('accepts both decimal separators without rounding or overflowing the inventory column', () => {
  assert.equal(parseStockAmount('12,250'), 12.25);
  assert.equal(parseStockAmount('.005'), 0.005);
  assert.equal(parseStockAmount('99999999999.999'), 99999999999.999);
  assert.equal(parseStockAmount('0'), 0);
  for (const invalid of ['', '-1', '1.2345', '1e3', '100000000000', '2,000.5']) {
    assert.equal(parseStockAmount(invalid), null, invalid);
  }
});

test('keeps available inventory at stock precision when subtracting fractional reservations', () => {
  const row = adaptAdminInventoryRow({ quantity: '7.1', reserved_quantity: '7.099', low_stock_threshold: '0.001' });
  assert.equal(row.stock_disponible, 0.001);
  assert.equal(row.stock_disponible, row.stock_minimo);
});
