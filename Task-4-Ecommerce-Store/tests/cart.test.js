import test from 'node:test';
import assert from 'node:assert/strict';
import {
  addToCartItem,
  removeFromCartItem,
  updateCartItemQuantity,
  CartManager
} from '../js/cart.js';

test('Shopping Cart: addToCart() functionality', async (t) => {
  await t.test('adds a new product to an empty cart with default quantity 1', () => {
    const product = { id: 1, title: 'Fjallraven Backpack', price: 109.95, category: "men's clothing" };
    const cart = addToCartItem([], product);

    assert.equal(cart.length, 1);
    assert.equal(cart[0].id, 1);
    assert.equal(cart[0].title, 'Fjallraven Backpack');
    assert.equal(cart[0].price, 109.95);
    assert.equal(cart[0].quantity, 1);
  });

  await t.test('increments quantity when existing product is added again', () => {
    const product = { id: 1, title: 'Fjallraven Backpack', price: 109.95 };
    let cart = addToCartItem([], product);
    cart = addToCartItem(cart, product);

    assert.equal(cart.length, 1);
    assert.equal(cart[0].quantity, 2);

    cart = addToCartItem(cart, product, 3);
    assert.equal(cart[0].quantity, 5);
  });

  await t.test('adds multiple distinct products to cart', () => {
    const p1 = { id: 1, title: 'Backpack', price: 109.95 };
    const p2 = { id: 2, title: 'T-Shirt', price: 22.3 };

    let cart = addToCartItem([], p1);
    cart = addToCartItem(cart, p2, 2);

    assert.equal(cart.length, 2);
    assert.equal(cart[0].id, 1);
    assert.equal(cart[0].quantity, 1);
    assert.equal(cart[1].id, 2);
    assert.equal(cart[1].quantity, 2);
  });

  await t.test('safely handles null or invalid product without throwing', () => {
    const cart = [{ id: 1, title: 'Backpack', price: 109.95, quantity: 1 }];
    const result1 = addToCartItem(cart, null);
    const result2 = addToCartItem(cart, undefined);
    const result3 = addToCartItem(cart, {});

    assert.equal(result1.length, 1);
    assert.equal(result2.length, 1);
    assert.equal(result3.length, 1);
  });
});

test('Shopping Cart: removeFromCart() functionality', async (t) => {
  await t.test('removes item by ID from cart', () => {
    const initialCart = [
      { id: 1, title: 'Product 1', price: 10, quantity: 1 },
      { id: 2, title: 'Product 2', price: 20, quantity: 2 }
    ];

    const updated = removeFromCartItem(initialCart, 1);
    assert.equal(updated.length, 1);
    assert.equal(updated[0].id, 2);
  });

  await t.test('works with string or numeric ID types', () => {
    const initialCart = [{ id: '42', title: 'Product 42', price: 15, quantity: 1 }];
    const updated = removeFromCartItem(initialCart, 42);
    assert.equal(updated.length, 0);
  });

  await t.test('leaves cart unchanged if productId is not found', () => {
    const initialCart = [{ id: 1, title: 'Product 1', price: 10, quantity: 1 }];
    const updated = removeFromCartItem(initialCart, 999);
    assert.equal(updated.length, 1);
    assert.equal(updated[0].id, 1);
  });
});

test('Shopping Cart: updateQuantity() functionality', async (t) => {
  await t.test('updates quantity to valid positive integers', () => {
    const initialCart = [{ id: 1, title: 'Backpack', price: 100, quantity: 2 }];
    const updated = updateCartItemQuantity(initialCart, 1, 5);

    assert.equal(updated.length, 1);
    assert.equal(updated[0].quantity, 5);
  });

  await t.test('automatically removes item if quantity is updated to 0 or less', () => {
    const initialCart = [{ id: 1, title: 'Backpack', price: 100, quantity: 2 }];
    const updatedZero = updateCartItemQuantity(initialCart, 1, 0);
    assert.equal(updatedZero.length, 0);

    const updatedNegative = updateCartItemQuantity(initialCart, 1, -3);
    assert.equal(updatedNegative.length, 0);
  });

  await t.test('ignores invalid or NaN quantities without corrupting state', () => {
    const initialCart = [{ id: 1, title: 'Backpack', price: 100, quantity: 2 }];
    const updated = updateCartItemQuantity(initialCart, 1, 'not-a-number');

    assert.equal(updated.length, 1);
    assert.equal(updated[0].quantity, 2);
  });
});

test('Shopping Cart: CartManager instance methods', () => {
  // Mock localStorage
  const store = {};
  const mockStorage = {
    getItem: (key) => store[key] || null,
    setItem: (key, val) => { store[key] = val; },
    removeItem: (key) => { delete store[key]; }
  };

  const manager = new CartManager(mockStorage);
  assert.equal(manager.getItems().length, 0);
  assert.equal(manager.getItemCount(), 0);

  // Add to cart
  manager.addToCart({ id: 101, title: 'Monitor', price: 299.99 });
  assert.equal(manager.getItems().length, 1);
  assert.equal(manager.getItemCount(), 1);

  // Update quantity
  manager.updateQuantity(101, 3);
  assert.equal(manager.getItemCount(), 3);

  // Calculate total
  const totals = manager.calculateTotal();
  assert.equal(totals.itemCount, 3);
  assert.equal(totals.subtotalCents, 29999 * 3);

  // Remove from cart
  manager.removeFromCart(101);
  assert.equal(manager.getItems().length, 0);
  assert.equal(manager.getItemCount(), 0);
});

