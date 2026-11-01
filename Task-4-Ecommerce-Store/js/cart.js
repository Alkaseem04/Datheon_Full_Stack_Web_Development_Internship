/**
 * Cart Business Logic & Pricing Engine for ShopSphere
 * Datheon Full Stack Web Development Internship Task 4
 * 
 * Uses integer cents internally for all monetary calculations to eliminate floating-point drift.
 */

export const STORAGE_KEY = 'shopsphere_cart';
export const TAX_RATE = 0.08; // 8% of subtotal
export const FREE_SHIPPING_THRESHOLD_CENTS = 10000; // $100.00 in cents
export const STANDARD_SHIPPING_CENTS = 1000; // $10.00 in cents

/**
 * Validates a cart item
 */
export function validateCartItem(item) {
  if (!item || typeof item !== 'object') return false;
  if (typeof item.id === 'undefined' || item.id === null) return false;
  if (!item.title || typeof item.title !== 'string') return false;
  if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0) return false;
  if (typeof item.quantity !== 'number' || isNaN(item.quantity) || item.quantity <= 0) return false;
  return true;
}

/**
 * Creates a clean cart item from product data
 */
export function createCartItem(product, quantity = 1) {
  if (!product || typeof product.id === 'undefined' || product.id === null) {
    throw new Error('Invalid product provided to createCartItem');
  }
  const cleanQty = Math.max(1, parseInt(quantity, 10) || 1);
  const price = typeof product.price === 'number' && !isNaN(product.price) ? Number(product.price) : 0;
  
  return {
    id: product.id,
    title: String(product.title || 'Untitled Product'),
    price: price,
    category: String(product.category || 'General'),
    image: String(product.image || ''),
    rating: product.rating || { rate: 0, count: 0 },
    quantity: cleanQty
  };
}

/**
 * Adds a product to the cart (pure function returning new cart array)
 */
export function addToCartItem(cart = [], product, quantity = 1) {
  if (!product || typeof product.id === 'undefined' || product.id === null) {
    console.error('addToCartItem: Invalid product', product);
    return [...cart];
  }

  const addQty = Math.max(1, parseInt(quantity, 10) || 1);
  const existingIndex = cart.findIndex(item => String(item.id) === String(product.id));

  if (existingIndex > -1) {
    return cart.map((item, index) => {
      if (index === existingIndex) {
        return {
          ...item,
          quantity: item.quantity + addQty
        };
      }
      return item;
    });
  }

  const newItem = createCartItem(product, addQty);
  return [...cart, newItem];
}

/**
 * Removes an item from the cart by productId
 */
export function removeFromCartItem(cart = [], productId) {
  return cart.filter(item => String(item.id) !== String(productId));
}

/**
 * Updates an item quantity in the cart
 * If quantity <= 0, item is removed from cart
 */
export function updateCartItemQuantity(cart = [], productId, quantity) {
  const parsedQty = parseInt(quantity, 10);
  
  if (isNaN(parsedQty)) {
    return [...cart];
  }

  if (parsedQty <= 0) {
    return removeFromCartItem(cart, productId);
  }

  return cart.map(item => {
    if (String(item.id) === String(productId)) {
      return {
        ...item,
        quantity: parsedQty
      };
    }
    return item;
  });
}

/**
 * Calculates monetary totals using integer cents
 * - Tax: 8% of subtotal
 * - Shipping: $10 for orders < $100; Free for orders >= $100; $0 if empty cart
 */
export function calculateTotals(cart = []) {
  let subtotalCents = 0;
  let totalQuantity = 0;

  for (const item of cart) {
    if (!item || typeof item.price !== 'number' || typeof item.quantity !== 'number') continue;
    const priceCents = Math.round(item.price * 100);
    const itemSubtotalCents = priceCents * Math.max(0, Math.floor(item.quantity));
    subtotalCents += itemSubtotalCents;
    totalQuantity += Math.max(0, Math.floor(item.quantity));
  }

  // Tax: 8% of subtotal in cents
  const taxCents = Math.round(subtotalCents * TAX_RATE);

  // Shipping rules:
  // If empty cart -> $0
  // If subtotal >= $100 (10,000 cents) -> FREE ($0)
  // Else -> $10.00 (1,000 cents)
  let shippingCents = 0;
  if (subtotalCents > 0) {
    shippingCents = subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 0 : STANDARD_SHIPPING_CENTS;
  }

  const totalCents = subtotalCents + taxCents + shippingCents;

  const centsUntilFree = Math.max(0, FREE_SHIPPING_THRESHOLD_CENTS - subtotalCents);
  const freeShippingProgress = subtotalCents === 0 
    ? 0 
    : Math.min(100, Math.round((subtotalCents / FREE_SHIPPING_THRESHOLD_CENTS) * 100));

  return {
    itemCount: totalQuantity,
    subtotalCents,
    taxCents,
    shippingCents,
    totalCents,
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    shipping: shippingCents / 100,
    total: totalCents / 100,
    formattedSubtotal: `$${(subtotalCents / 100).toFixed(2)}`,
    formattedTax: `$${(taxCents / 100).toFixed(2)}`,
    formattedShipping: shippingCents === 0 
      ? (subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS ? 'FREE' : '$0.00') 
      : `$${(shippingCents / 100).toFixed(2)}`,
    formattedTotal: `$${(totalCents / 100).toFixed(2)}`,
    isFreeShippingUnlocked: subtotalCents >= FREE_SHIPPING_THRESHOLD_CENTS && subtotalCents > 0,
    amountUntilFreeShipping: (centsUntilFree / 100).toFixed(2),
    freeShippingProgress
  };
}

/**
 * Saves cart array to localStorage or custom storage provider
 */
export function saveCartToStorage(cart, storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return false;
  try {
    const data = JSON.stringify(cart);
    storage.setItem(STORAGE_KEY, data);
    return true;
  } catch (err) {
    console.error('Failed to save cart to storage:', err);
    return false;
  }
}

/**
 * Loads cart array from localStorage or custom storage provider
 */
export function loadCartFromStorage(storage = (typeof window !== 'undefined' ? window.localStorage : null)) {
  if (!storage) return [];
  try {
    const data = storage.getItem(STORAGE_KEY);
    if (!data) return [];
    const parsed = JSON.parse(data);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(validateCartItem);
  } catch (err) {
    console.error('Failed to load cart from storage:', err);
    return [];
  }
}

/**
 * Cart Manager class providing the exact required function signatures:
 * - addToCart(product)
 * - removeFromCart(productId)
 * - updateQuantity(productId, quantity)
 * - calculateTotal()
 * - saveCart()
 * - loadCart()
 */
export class CartManager {
  constructor(storage = (typeof window !== 'undefined' ? window.localStorage : null), onCartUpdated = null) {
    this.storage = storage;
    this.onCartUpdated = onCartUpdated;
    this.items = this.loadCart();
  }

  loadCart() {
    this.items = loadCartFromStorage(this.storage);
    return this.items;
  }

  saveCart() {
    return saveCartToStorage(this.items, this.storage);
  }

  addToCart(product, quantity = 1) {
    this.items = addToCartItem(this.items, product, quantity);
    this.saveCart();
    if (typeof this.onCartUpdated === 'function') {
      this.onCartUpdated(this.items, this.calculateTotal());
    }
    return this.items;
  }

  removeFromCart(productId) {
    this.items = removeFromCartItem(this.items, productId);
    this.saveCart();
    if (typeof this.onCartUpdated === 'function') {
      this.onCartUpdated(this.items, this.calculateTotal());
    }
    return this.items;
  }

  updateQuantity(productId, quantity) {
    this.items = updateCartItemQuantity(this.items, productId, quantity);
    this.saveCart();
    if (typeof this.onCartUpdated === 'function') {
      this.onCartUpdated(this.items, this.calculateTotal());
    }
    return this.items;
  }

  calculateTotal() {
    return calculateTotals(this.items);
  }

  clearCart() {
    this.items = [];
    this.saveCart();
    if (typeof this.onCartUpdated === 'function') {
      this.onCartUpdated(this.items, this.calculateTotal());
    }
    return this.items;
  }

  getItems() {
    return [...this.items];
  }

  getItemCount() {
    return this.items.reduce((sum, item) => sum + item.quantity, 0);
  }
}

