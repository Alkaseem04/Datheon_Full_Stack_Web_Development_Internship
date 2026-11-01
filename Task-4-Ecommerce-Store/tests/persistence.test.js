import test from 'node:test';
import assert from 'node:assert/strict';
import {
  STORAGE_KEY,
  saveCartToStorage,
  loadCartFromStorage,
  validateCartItem
} from '../js/cart.js';

function createMockStorage(initialData = {}) {
  const store = { ...initialData };
  return {
    getItem: (key) => store[key] !== undefined ? store[key] : null,
    setItem: (key, value) => { store[key] = String(value); },
    removeItem: (key) => { delete store[key]; },
    clear: () => {
      for (const k in store) delete store[k];
    },
    _getRaw: () => store
  };
}

test('Cart Persistence: saveCartToStorage and loadCartFromStorage', async (t) => {
  await t.test('saves cart to storage and loads it back accurately', () => {
    const mockStorage = createMockStorage();
    const cart = [
      { id: 1, title: 'Item 1', price: 25.5, quantity: 2, category: 'electronics' },
      { id: 2, title: 'Item 2', price: 40.0, quantity: 1, category: 'jewelery' }
    ];

    const saveSuccess = saveCartToStorage(cart, mockStorage);
    assert.equal(saveSuccess, true);

    const savedJson = mockStorage.getItem(STORAGE_KEY);
    assert.ok(savedJson);

    const loaded = loadCartFromStorage(mockStorage);
    assert.equal(loaded.length, 2);
    assert.equal(loaded[0].id, 1);
    assert.equal(loaded[0].quantity, 2);
    assert.equal(loaded[1].title, 'Item 2');
  });

  await t.test('returns empty array when storage key is missing or empty', () => {
    const mockStorage = createMockStorage();
    const loaded = loadCartFromStorage(mockStorage);
    assert.deepEqual(loaded, []);
  });

  await t.test('gracefully recovers from corrupt JSON data in storage', () => {
    const mockStorage = createMockStorage({
      [STORAGE_KEY]: '{ invalid-json-payload-corrupted'
    });

    const loaded = loadCartFromStorage(mockStorage);
    assert.deepEqual(loaded, []);
  });

  await t.test('filters out invalid items during load to prevent state corruption', () => {
    const mockStorage = createMockStorage({
      [STORAGE_KEY]: JSON.stringify([
        { id: 1, title: 'Valid Item', price: 10, quantity: 2 },
        { id: null, title: 'No ID', price: 10, quantity: 1 },
        { id: 2, title: '', price: 10, quantity: 1 },
        { id: 3, title: 'Bad Price', price: -5, quantity: 1 },
        { id: 4, title: 'Bad Quantity', price: 10, quantity: 0 },
        null,
        'string instead of item'
      ])
    });

    const loaded = loadCartFromStorage(mockStorage);
    assert.equal(loaded.length, 1);
    assert.equal(loaded[0].id, 1);
  });

  await t.test('handles storage being null or undefined without throwing errors', () => {
    assert.equal(saveCartToStorage([], null), false);
    assert.deepEqual(loadCartFromStorage(null), []);
  });
});

