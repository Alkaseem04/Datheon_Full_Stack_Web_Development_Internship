import test from 'node:test';
import assert from 'node:assert/strict';
import {
  matchesCategory,
  matchesSearch,
  sortProducts,
  filterProducts,
  normalizeCategory
} from '../js/filters.js';

const sampleProducts = [
  { id: 1, title: 'Fjallraven Backpack', price: 109.95, category: "men's clothing", rating: { rate: 3.9, count: 120 } },
  { id: 2, title: 'Mens Casual Slim Fit T-Shirt', price: 22.3, category: "men's clothing", rating: { rate: 4.1, count: 259 } },
  { id: 3, title: 'John Hardy Silver Dragon Bracelet', price: 695.0, category: 'jewelery', rating: { rate: 4.6, count: 400 } },
  { id: 4, title: 'Solid Gold Petite Micropave Ring', price: 168.0, category: 'jewelery', rating: { rate: 3.9, count: 70 } },
  { id: 5, title: 'WD 2TB Elements Portable External Hard Drive', price: 64.0, category: 'electronics', rating: { rate: 3.3, count: 203 } },
  { id: 6, title: 'SanDisk SSD PLUS 1TB Internal SSD', price: 109.0, category: 'electronics', rating: { rate: 4.5, count: 470 } },
  { id: 7, title: 'BIYLACLESEN Womens 3-in-1 Snowboard Jacket', price: 56.99, category: "women's clothing", rating: { rate: 2.6, count: 235 } },
  { id: 8, title: 'Lock and Love Womens Faux Leather Jacket', price: 29.95, category: "women's clothing", rating: { rate: 2.9, count: 340 } }
];

test('Category Filtering: matchesCategory()', async (t) => {
  await t.test('matches all products when category is "all"', () => {
    sampleProducts.forEach(product => {
      assert.equal(matchesCategory(product, 'all'), true);
      assert.equal(matchesCategory(product, 'All Products'), true);
    });
  });

  await t.test('accurately filters by exact FakeStoreAPI categories', () => {
    const electronics = sampleProducts.filter(p => matchesCategory(p, 'electronics'));
    assert.equal(electronics.length, 2);
    assert.deepEqual(electronics.map(p => p.id), [5, 6]);

    const mens = sampleProducts.filter(p => matchesCategory(p, "men's clothing"));
    assert.equal(mens.length, 2);
    assert.deepEqual(mens.map(p => p.id), [1, 2]);

    const womens = sampleProducts.filter(p => matchesCategory(p, "women's clothing"));
    assert.equal(womens.length, 2);
    assert.deepEqual(womens.map(p => p.id), [7, 8]);

    const jewelry = sampleProducts.filter(p => matchesCategory(p, 'jewelery'));
    assert.equal(jewelry.length, 2);
    assert.deepEqual(jewelry.map(p => p.id), [3, 4]);
  });

  await t.test('handles case-insensitivity and American vs API spelling ("jewelry" vs "jewelery")', () => {
    const jewelerySpelling = sampleProducts.filter(p => matchesCategory(p, 'jewelery'));
    const jewelrySpelling = sampleProducts.filter(p => matchesCategory(p, 'jewelry'));
    assert.equal(jewelerySpelling.length, 2);
    assert.equal(jewelrySpelling.length, 2);
    assert.deepEqual(jewelerySpelling, jewelrySpelling);
  });
});

test('Product Search: matchesSearch()', async (t) => {
  await t.test('searches product title case-insensitively', () => {
    const results = sampleProducts.filter(p => matchesSearch(p, 'backpack'));
    assert.equal(results.length, 1);
    assert.equal(results[0].id, 1);

    const upperResults = sampleProducts.filter(p => matchesSearch(p, 'BACKPACK'));
    assert.equal(upperResults.length, 1);
    assert.equal(upperResults[0].id, 1);
  });

  await t.test('matches partial substrings and trims whitespace', () => {
    const results = sampleProducts.filter(p => matchesSearch(p, '  jacket  '));
    assert.equal(results.length, 2);
    assert.deepEqual(results.map(p => p.id), [7, 8]);
  });

  await t.test('returns empty array when search query matches no products', () => {
    const results = sampleProducts.filter(p => matchesSearch(p, 'NonExistentProductXYZ123'));
    assert.equal(results.length, 0);
  });

  await t.test('returns all products when search query is empty or whitespace', () => {
    const results = sampleProducts.filter(p => matchesSearch(p, '   '));
    assert.equal(results.length, sampleProducts.length);
  });
});

test('Combined Filter and Search: filterProducts()', async (t) => {
  await t.test('filters by category AND search simultaneously', () => {
    // Search "jacket" inside "women's clothing" -> 2 items
    const womensJackets = filterProducts(sampleProducts, {
      category: "women's clothing",
      search: 'jacket'
    });
    assert.equal(womensJackets.length, 2);

    // Search "jacket" inside "men's clothing" -> 0 items
    const mensJackets = filterProducts(sampleProducts, {
      category: "men's clothing",
      search: 'jacket'
    });
    assert.equal(mensJackets.length, 0);

    // Search "jacket" in "all" -> 2 items
    const allJackets = filterProducts(sampleProducts, {
      category: 'all',
      search: 'jacket'
    });
    assert.equal(allJackets.length, 2);
  });
});

test('Product Sorting: sortProducts()', async (t) => {
  await t.test('sorts by price low-to-high', () => {
    const sorted = sortProducts(sampleProducts, 'price-low');
    assert.equal(sorted[0].price, 22.3);
    assert.equal(sorted[sorted.length - 1].price, 695.0);
  });

  await t.test('sorts by price high-to-low', () => {
    const sorted = sortProducts(sampleProducts, 'price-high');
    assert.equal(sorted[0].price, 695.0);
    assert.equal(sorted[sorted.length - 1].price, 22.3);
  });

  await t.test('sorts by highest rating', () => {
    const sorted = sortProducts(sampleProducts, 'rating-desc');
    assert.equal(sorted[0].rating.rate, 4.6); // John Hardy
  });

  await t.test('sorts alphabetically by title', () => {
    const sorted = sortProducts(sampleProducts, 'title-asc');
    assert.equal(sorted[0].title.startsWith('BIYLACLESEN'), true);
  });
});

