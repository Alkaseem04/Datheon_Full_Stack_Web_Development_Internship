import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateProduct,
  validateProducts,
  fetchProducts
} from '../js/api.js';

test('API Validation: validateProduct()', async (t) => {
  await t.test('accepts a well-formed product from FakeStoreAPI', () => {
    const raw = {
      id: 1,
      title: 'Fjallraven Backpack',
      price: 109.95,
      description: 'Your perfect pack for everyday use',
      category: "men's clothing",
      image: 'https://fakestoreapi.com/img/81fPKd-2AYL._AC_SL1500_.jpg',
      rating: { rate: 3.9, count: 120 }
    };

    const res = validateProduct(raw);
    assert.equal(res.valid, true);
    assert.equal(res.product.id, 1);
    assert.equal(res.product.title, 'Fjallraven Backpack');
    assert.equal(res.product.price, 109.95);
    assert.equal(res.product.category, "men's clothing");
    assert.equal(res.product.rating.rate, 3.9);
    assert.equal(res.product.rating.count, 120);
  });

  await t.test('rejects null or non-object payloads', () => {
    assert.equal(validateProduct(null).valid, false);
    assert.equal(validateProduct(undefined).valid, false);
    assert.equal(validateProduct('string').valid, false);
    assert.equal(validateProduct(123).valid, false);
  });

  await t.test('rejects missing or empty title', () => {
    assert.equal(validateProduct({ id: 1, price: 10, category: 'cat', image: 'url' }).valid, false);
    assert.equal(validateProduct({ id: 1, title: '', price: 10, category: 'cat', image: 'url' }).valid, false);
    assert.equal(validateProduct({ id: 1, title: '   ', price: 10, category: 'cat', image: 'url' }).valid, false);
  });

  await t.test('rejects missing, NaN, or negative prices', () => {
    assert.equal(validateProduct({ id: 1, title: 'Test', price: -5, category: 'cat', image: 'url' }).valid, false);
    assert.equal(validateProduct({ id: 1, title: 'Test', price: NaN, category: 'cat', image: 'url' }).valid, false);
    assert.equal(validateProduct({ id: 1, title: 'Test', price: 'free', category: 'cat', image: 'url' }).valid, false);
  });

  await t.test('rejects missing category or image', () => {
    assert.equal(validateProduct({ id: 1, title: 'Test', price: 10, image: 'url' }).valid, false);
    assert.equal(validateProduct({ id: 1, title: 'Test', price: 10, category: 'cat' }).valid, false);
  });
});

test('API Validation: validateProducts()', async (t) => {
  await t.test('throws error if response is not an array', () => {
    assert.throws(() => validateProducts(null), /expected an array/);
    assert.throws(() => validateProducts({ error: 'Server error' }), /expected an array/);
    assert.throws(() => validateProducts('not an array'), /expected an array/);
  });

  await t.test('returns empty array when given an empty array', () => {
    const res = validateProducts([]);
    assert.deepEqual(res, []);
  });

  await t.test('filters valid products and drops corrupted elements', () => {
    const mixed = [
      { id: 1, title: 'Valid 1', price: 10, category: 'cat', image: 'url' },
      { id: null, title: 'Bad', price: 10 },
      { id: 2, title: 'Valid 2', price: 20, category: 'cat', image: 'url' }
    ];

    const valid = validateProducts(mixed);
    assert.equal(valid.length, 2);
    assert.equal(valid[0].id, 1);
    assert.equal(valid[1].id, 2);
  });

  await t.test('throws error if all items in non-empty array are invalid', () => {
    const allBad = [
      { bad: 'data' },
      { invalid: true }
    ];
    assert.throws(() => validateProducts(allBad), /All received items failed validation/);
  });
});

test('API Client: fetchProducts() with mocked responses', async (t) => {
  await t.test('successfully fetches and validates products from mock fetch', async () => {
    const mockData = [
      {
        id: 1,
        title: 'Mock Product',
        price: 49.99,
        category: 'electronics',
        image: 'https://example.com/item.jpg',
        rating: { rate: 4.8, count: 50 }
      }
    ];

    const mockFetch = async () => ({
      ok: true,
      status: 200,
      json: async () => mockData
    });

    const products = await fetchProducts('https://example.com', { fetchFn: mockFetch });
    assert.equal(products.length, 1);
    assert.equal(products[0].title, 'Mock Product');
  });

  await t.test('throws error when server responds with HTTP error code (e.g. 500)', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error'
    });

    await assert.rejects(
      () => fetchProducts('https://example.com', { fetchFn: mockFetch }),
      /HTTP 500/
    );
  });

  await t.test('propagates network failure gracefully', async () => {
    const mockFetch = async () => {
      throw new Error('Failed to fetch: Network unreachable');
    };

    await assert.rejects(
      () => fetchProducts('https://example.com', { fetchFn: mockFetch }),
      /Network unreachable/
    );
  });
});

