import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateTotals } from '../js/cart.js';

test('Pricing & Calculation Rules: calculateTotal()', async (t) => {
  await t.test('returns zero totals for an empty cart', () => {
    const totals = calculateTotals([]);

    assert.equal(totals.itemCount, 0);
    assert.equal(totals.subtotalCents, 0);
    assert.equal(totals.taxCents, 0);
    assert.equal(totals.shippingCents, 0);
    assert.equal(totals.totalCents, 0);
    assert.equal(totals.formattedSubtotal, '$0.00');
    assert.equal(totals.formattedTax, '$0.00');
    assert.equal(totals.formattedShipping, '$0.00');
    assert.equal(totals.formattedTotal, '$0.00');
    assert.equal(totals.isFreeShippingUnlocked, false);
    assert.equal(totals.amountUntilFreeShipping, '100.00');
  });

  await t.test('charges $10 shipping when subtotal is strictly below $100', () => {
    // Single item: $50.00
    const cart = [{ id: 1, title: 'Item 1', price: 50.0, quantity: 1 }];
    const totals = calculateTotals(cart);

    assert.equal(totals.subtotalCents, 5000); // $50.00
    // Tax = 8% of 5000 = 400 cents ($4.00)
    assert.equal(totals.taxCents, 400);
    // Shipping = $10.00 (1000 cents)
    assert.equal(totals.shippingCents, 1000);
    // Total = 5000 + 400 + 1000 = 6400 cents ($64.00)
    assert.equal(totals.totalCents, 6400);
    assert.equal(totals.formattedSubtotal, '$50.00');
    assert.equal(totals.formattedTax, '$4.00');
    assert.equal(totals.formattedShipping, '$10.00');
    assert.equal(totals.formattedTotal, '$64.00');
    assert.equal(totals.isFreeShippingUnlocked, false);
    assert.equal(totals.amountUntilFreeShipping, '50.00');
  });

  await t.test('provides FREE shipping when subtotal equals exactly $100.00', () => {
    const cart = [{ id: 1, title: 'Item 1', price: 100.0, quantity: 1 }];
    const totals = calculateTotals(cart);

    assert.equal(totals.subtotalCents, 10000);
    // Tax = 8% of 10000 = 800 cents ($8.00)
    assert.equal(totals.taxCents, 800);
    // Shipping = $0 (FREE)
    assert.equal(totals.shippingCents, 0);
    // Total = 10000 + 800 + 0 = 10800 cents ($108.00)
    assert.equal(totals.totalCents, 10800);
    assert.equal(totals.formattedShipping, 'FREE');
    assert.equal(totals.formattedTotal, '$108.00');
    assert.equal(totals.isFreeShippingUnlocked, true);
    assert.equal(totals.amountUntilFreeShipping, '0.00');
    assert.equal(totals.freeShippingProgress, 100);
  });

  await t.test('provides FREE shipping when subtotal exceeds $100.00', () => {
    // FakeStore backpack: $109.95
    const cart = [{ id: 1, title: 'Backpack', price: 109.95, quantity: 1 }];
    const totals = calculateTotals(cart);

    assert.equal(totals.subtotalCents, 10995);
    // Tax: 10995 * 0.08 = 879.6 -> round to 880 cents ($8.80)
    assert.equal(totals.taxCents, 880);
    assert.equal(totals.shippingCents, 0);
    // Total: 10995 + 880 = 11875 cents ($118.75)
    assert.equal(totals.totalCents, 11875);
    assert.equal(totals.formattedSubtotal, '$109.95');
    assert.equal(totals.formattedTax, '$8.80');
    assert.equal(totals.formattedShipping, 'FREE');
    assert.equal(totals.formattedTotal, '$118.75');
    assert.equal(totals.isFreeShippingUnlocked, true);
  });

  await t.test('eliminates floating-point inaccuracies using integer cents', () => {
    // Famous float issue: 0.1 + 0.2 === 0.30000000000000004
    // Products priced at 19.99 and 9.99
    const cart = [
      { id: 1, title: 'Shirt', price: 19.99, quantity: 3 }, // 59.97 -> 5997 cents
      { id: 2, title: 'Hat', price: 9.99, quantity: 2 }      // 19.98 -> 1998 cents
    ];
    const totals = calculateTotals(cart);

    assert.equal(totals.subtotalCents, 5997 + 1998); // 7995 cents ($79.95)
    assert.equal(totals.formattedSubtotal, '$79.95');
    // Tax: 7995 * 0.08 = 639.6 -> round to 640 cents ($6.40)
    assert.equal(totals.taxCents, 640);
    assert.equal(totals.formattedTax, '$6.40');
    // Shipping: under $100 -> $10.00
    assert.equal(totals.shippingCents, 1000);
    // Total: 7995 + 640 + 1000 = 9635 cents ($96.35)
    assert.equal(totals.totalCents, 9635);
    assert.equal(totals.formattedTotal, '$96.35');
  });
});

