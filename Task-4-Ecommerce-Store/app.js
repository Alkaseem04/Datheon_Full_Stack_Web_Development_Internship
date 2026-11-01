/**
 * ShopSphere - Main Application Controller
 * Datheon Full Stack Web Development Internship Task 4
 * 
 * Orchestrates API data fetching, DOM rendering, search & category filtering,
 * shopping cart state management with localStorage persistence, and simulated checkout.
 */

import { CartManager } from './js/cart.js';
import { fetchProducts } from './js/api.js';
import { filterProducts, normalizeCategory } from './js/filters.js';

// ============================================================================
// State Variables
// ============================================================================
let allProducts = [];
let currentCategory = 'all';
let searchQuery = '';
let currentSort = 'featured';
let quickViewSelectedProduct = null;
let quickViewQuantity = 1;

// ============================================================================
// Cart Manager Initialization
// ============================================================================
const cartManager = new CartManager(
  typeof window !== 'undefined' ? window.localStorage : null,
  (items, totals) => {
    updateCartUI(items, totals);
  }
);

// ============================================================================
// DOM Element Selectors
// ============================================================================
const elements = {
  // Navigation & Search
  navSearchInput: document.getElementById('nav-search-input'),
  searchClearBtn: document.getElementById('search-clear-btn'),
  mobileSearchToggle: document.getElementById('mobile-search-toggle'),
  mobileSearchBar: document.getElementById('mobile-search-bar'),
  mobileSearchInput: document.getElementById('mobile-search-input'),
  mobileSearchClearBtn: document.getElementById('mobile-search-clear-btn'),
  cartTriggerBtn: document.getElementById('cart-trigger-btn'),
  cartBadge: document.getElementById('cart-badge'),
  heroCartCta: document.getElementById('hero-cart-cta'),
  heroCartCount: document.querySelector('.hero-cart-count'),

  // Catalog Section
  catalogLiveCount: document.getElementById('catalog-live-count'),
  categoryButtons: document.querySelectorAll('.category-btn'),
  sortSelect: document.getElementById('sort-select'),
  activeFiltersBar: document.getElementById('active-filters-bar'),
  activeFiltersList: document.getElementById('active-filters-list'),
  resetAllFiltersBtn: document.getElementById('reset-all-filters-btn'),
  productsGrid: document.getElementById('products-grid'),
  networkErrorState: document.getElementById('network-error-state'),
  errorMessageText: document.getElementById('error-message-text'),
  retryFetchBtn: document.getElementById('retry-fetch-btn'),
  emptyResultsState: document.getElementById('empty-results-state'),
  emptyStateMessage: document.getElementById('empty-state-message'),
  clearSearchBtn: document.getElementById('clear-search-btn'),

  // Cart Drawer
  cartDrawer: document.getElementById('cart-drawer'),
  cartCloseBtn: document.getElementById('cart-close-btn'),
  cartBackdrop: document.getElementById('cart-backdrop'),
  drawerItemCount: document.getElementById('drawer-item-count'),
  shippingProgressText: document.getElementById('shipping-progress-text'),
  shippingProgressFill: document.getElementById('shipping-progress-fill'),
  cartEmptyState: document.getElementById('cart-empty-state'),
  cartItemsList: document.getElementById('cart-items-list'),
  startShoppingBtn: document.getElementById('start-shopping-btn'),
  cartSubtotalVal: document.getElementById('cart-subtotal-val'),
  cartTaxVal: document.getElementById('cart-tax-val'),
  cartShippingVal: document.getElementById('cart-shipping-val'),
  cartTotalVal: document.getElementById('cart-total-val'),
  proceedCheckoutBtn: document.getElementById('proceed-checkout-btn'),
  clearCartBtn: document.getElementById('clear-cart-btn'),

  // Checkout Modal
  checkoutModal: document.getElementById('checkout-modal'),
  checkoutCloseBtn: document.getElementById('checkout-close-btn'),
  cancelCheckoutBtn: document.getElementById('cancel-checkout-btn'),
  checkoutForm: document.getElementById('checkout-form'),
  checkoutFormView: document.getElementById('checkout-form-view'),
  checkoutSuccessView: document.getElementById('checkout-success-view'),
  checkoutItemsPreview: document.getElementById('checkout-items-preview'),
  checkoutSubtotalVal: document.getElementById('checkout-subtotal-val'),
  checkoutTaxVal: document.getElementById('checkout-tax-val'),
  checkoutShippingVal: document.getElementById('checkout-shipping-val'),
  checkoutTotalVal: document.getElementById('checkout-total-val'),
  placeOrderBtn: document.getElementById('place-order-btn'),
  placeOrderText: document.getElementById('place-order-text'),
  placeOrderSpinner: document.getElementById('place-order-spinner'),
  continueShoppingBtn: document.getElementById('continue-shopping-btn'),

  // Receipt Elements
  receiptOrderId: document.getElementById('receipt-order-id'),
  receiptCustomerName: document.getElementById('receipt-customer-name'),
  receiptCustomerEmail: document.getElementById('receipt-customer-email'),
  receiptDeliveryDate: document.getElementById('receipt-delivery-date'),
  receiptTotalPaid: document.getElementById('receipt-total-paid'),

  // Quick View Modal
  quickViewModal: document.getElementById('quick-view-modal'),
  quickViewCloseBtn: document.getElementById('quick-view-close-btn'),
  quickViewBody: document.getElementById('quick-view-body'),
  modalBackdrop: document.getElementById('modal-backdrop'),

  // Toast Container
  toastContainer: document.getElementById('toast-container')
};

// ============================================================================
// Helper Utilities
// ============================================================================

/**
 * Formats numeric price into USD currency string
 */
function formatPrice(price) {
  const num = typeof price === 'number' && !isNaN(price) ? price : 0;
  return `$${num.toFixed(2)}`;
}

/**
 * Escapes HTML strings to prevent XSS injection
 */
function escapeHtml(str) {
  if (typeof str !== 'string') return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Debounce helper for responsive search typing
 */
function debounce(func, wait = 150) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Maps category strings to clean CSS class names
 */
function getCategoryBadgeClass(category = '') {
  const norm = normalizeCategory(category);
  switch (norm) {
    case 'electronics': return 'cat-electronics';
    case 'jewelery': return 'cat-jewelery';
    case "men's clothing": return 'cat-mens-clothing';
    case "women's clothing": return 'cat-womens-clothing';
    default: return 'cat-general';
  }
}

/**
 * Formats category name for friendly UI display
 */
function formatCategoryDisplayName(category = '') {
  const norm = normalizeCategory(category);
  switch (norm) {
    case 'electronics': return 'Electronics';
    case 'jewelery': return 'Jewelry';
    case "men's clothing": return "Men's Clothing";
    case "women's clothing": return "Women's Clothing";
    case 'all': return 'All Products';
    default: return category;
  }
}

/**
 * Renders SVG rating stars
 */
function renderRatingStars(rate = 0) {
  const fullStars = Math.floor(rate);
  const hasHalfStar = rate - fullStars >= 0.4;
  let starsHtml = '';

  for (let i = 0; i < 5; i++) {
    if (i < fullStars) {
      starsHtml += `<svg class="star-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    } else if (i === fullStars && hasHalfStar) {
      starsHtml += `<svg class="star-icon" viewBox="0 0 20 20" fill="currentColor"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" fill-opacity="0.45"/></svg>`;
    } else {
      starsHtml += `<svg class="star-icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>`;
    }
  }

  return starsHtml;
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'success') {
  if (!elements.toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast toast-${type}`;
  toast.setAttribute('role', 'status');
  toast.innerHTML = `
    <span class="toast-icon">${type === 'success' ? '✓' : 'ℹ'}</span>
    <span class="toast-message">${escapeHtml(message)}</span>
  `;

  elements.toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 250ms ease';
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 250);
  }, 3200);
}

// ============================================================================
// Loading Skeleton Renderers
// ============================================================================
function renderLoadingSkeletons(count = 8) {
  if (!elements.productsGrid) return;
  elements.productsGrid.setAttribute('aria-busy', 'true');
  elements.productsGrid.innerHTML = '';

  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement('div');
    skeleton.className = 'skeleton-card';
    skeleton.innerHTML = `
      <div class="skeleton-box skeleton-image"></div>
      <div class="skeleton-box skeleton-tag"></div>
      <div class="skeleton-box skeleton-title-1"></div>
      <div class="skeleton-box skeleton-title-2"></div>
      <div class="skeleton-row">
        <div class="skeleton-box skeleton-price"></div>
        <div class="skeleton-box skeleton-btn"></div>
      </div>
    `;
    elements.productsGrid.appendChild(skeleton);
  }
}

// ============================================================================
// Product Grid Rendering
// ============================================================================
function renderProducts() {
  const filtered = filterProducts(allProducts, {
    category: currentCategory,
    search: searchQuery,
    sortBy: currentSort
  });

  // Update live count text
  if (elements.catalogLiveCount) {
    const categoryName = formatCategoryDisplayName(currentCategory);
    if (currentCategory === 'all') {
      elements.catalogLiveCount.textContent = `Showing ${filtered.length} of ${allProducts.length} products`;
    } else {
      elements.catalogLiveCount.textContent = `Showing ${filtered.length} in ${categoryName}`;
    }
  }

  // Manage Active Filters Chips Bar
  updateActiveFiltersBar();

  // If no products match, display Empty Results state
  if (filtered.length === 0) {
    if (elements.productsGrid) {
      elements.productsGrid.innerHTML = '';
      elements.productsGrid.setAttribute('aria-busy', 'false');
    }
    if (elements.emptyResultsState) {
      elements.emptyResultsState.classList.remove('hidden');
      if (elements.emptyStateMessage) {
        if (searchQuery.trim()) {
          elements.emptyStateMessage.textContent = `No products found matching "${searchQuery}" in ${formatCategoryDisplayName(currentCategory)}.`;
        } else {
          elements.emptyStateMessage.textContent = `No products found in the "${formatCategoryDisplayName(currentCategory)}" category.`;
        }
      }
    }
    return;
  }

  // Hide empty state and network error
  if (elements.emptyResultsState) elements.emptyResultsState.classList.add('hidden');
  if (elements.networkErrorState) elements.networkErrorState.classList.add('hidden');

  if (!elements.productsGrid) return;
  elements.productsGrid.setAttribute('aria-busy', 'false');
  elements.productsGrid.innerHTML = '';

  filtered.forEach(product => {
    const card = document.createElement('article');
    card.className = 'product-card';
    card.setAttribute('data-id', product.id);

    const badgeClass = getCategoryBadgeClass(product.category);
    const categoryName = formatCategoryDisplayName(product.category);
    const ratingRate = product.rating ? product.rating.rate : 0;
    const ratingCount = product.rating ? product.rating.count : 0;

    card.innerHTML = `
      <div class="card-media-wrapper">
        <span class="category-badge ${badgeClass} card-category-tag">${escapeHtml(categoryName)}</span>
        <img 
          src="${escapeHtml(product.image)}" 
          alt="${escapeHtml(product.title)}" 
          class="card-image"
          loading="lazy"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22200%22 viewBox=%220 0 200 200%22><rect width=%22200%22 height=%22200%22 fill=%22%23f1f5f9%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%2214%22 fill=%22%2394a3b8%22>Product Image</text></svg>'"
        >
        <button 
          type="button" 
          class="card-quick-view-btn" 
          data-id="${product.id}"
          aria-label="Quick view ${escapeHtml(product.title)}"
        >
          Quick View
        </button>
      </div>
      <div class="card-body">
        <div class="card-rating-row" aria-label="Rating: ${ratingRate} out of 5 stars with ${ratingCount} reviews">
          <div class="rating-stars" aria-hidden="true">${renderRatingStars(ratingRate)}</div>
          <span class="rating-score">${ratingRate.toFixed(1)}</span>
          <span class="rating-count">(${ratingCount})</span>
        </div>
        <h3 class="card-title" title="${escapeHtml(product.title)}">
          ${escapeHtml(product.title)}
        </h3>
        <div class="card-footer">
          <div class="card-price-box">
            <span class="card-price-label">Price</span>
            <span class="card-price">${formatPrice(product.price)}</span>
          </div>
          <button 
            type="button" 
            class="card-add-btn" 
            data-id="${product.id}"
            aria-label="Add ${escapeHtml(product.title)} to shopping cart"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
            </svg>
            <span>Add</span>
          </button>
        </div>
      </div>
    `;

    elements.productsGrid.appendChild(card);
  });
}

/**
 * Updates the active filter chips list
 */
function updateActiveFiltersBar() {
  if (!elements.activeFiltersBar || !elements.activeFiltersList) return;

  const hasCategoryFilter = currentCategory !== 'all';
  const hasSearchFilter = searchQuery.trim().length > 0;

  if (!hasCategoryFilter && !hasSearchFilter) {
    elements.activeFiltersBar.classList.add('hidden');
    elements.activeFiltersList.innerHTML = '';
    return;
  }

  elements.activeFiltersBar.classList.remove('hidden');
  elements.activeFiltersList.innerHTML = '';

  if (hasCategoryFilter) {
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      Category: ${escapeHtml(formatCategoryDisplayName(currentCategory))}
      <span class="filter-chip-remove" data-action="clear-category" aria-label="Remove category filter">&times;</span>
    `;
    elements.activeFiltersList.appendChild(chip);
  }

  if (hasSearchFilter) {
    const chip = document.createElement('span');
    chip.className = 'filter-chip';
    chip.innerHTML = `
      Search: "${escapeHtml(searchQuery)}"
      <span class="filter-chip-remove" data-action="clear-search" aria-label="Remove search filter">&times;</span>
    `;
    elements.activeFiltersList.appendChild(chip);
  }
}

// ============================================================================
// Shopping Cart UI Synchronization
// ============================================================================
function updateCartUI(items = [], totals = {}) {
  const count = cartManager.getItemCount();

  // 1. Live Navbar Cart Badge & Pulse
  if (elements.cartBadge) {
    elements.cartBadge.textContent = String(count);
    elements.cartBadge.classList.remove('pulse');
    void elements.cartBadge.offsetWidth; // Trigger reflow
    elements.cartBadge.classList.add('pulse');
  }

  // 2. Hero Cart Count
  if (elements.heroCartCount) {
    elements.heroCartCount.textContent = String(count);
  }

  // 3. Cart Trigger accessibility
  if (elements.cartTriggerBtn) {
    elements.cartTriggerBtn.setAttribute('aria-label', `View shopping cart, ${count} items`);
  }

  // 4. Cart Drawer Items Count
  if (elements.drawerItemCount) {
    elements.drawerItemCount.textContent = `${count} ${count === 1 ? 'item' : 'items'}`;
  }

  // 5. Free Shipping Progress
  if (elements.shippingProgressText && elements.shippingProgressFill) {
    if (totals.isFreeShippingUnlocked) {
      elements.shippingProgressText.className = 'shipping-progress-text unlocked';
      elements.shippingProgressText.innerHTML = `🎉 <strong>Congratulations!</strong> You qualify for <strong>FREE Shipping!</strong>`;
      elements.shippingProgressFill.style.width = '100%';
    } else if (totals.subtotalCents > 0) {
      elements.shippingProgressText.className = 'shipping-progress-text';
      elements.shippingProgressText.innerHTML = `Add <strong>$${totals.amountUntilFreeShipping}</strong> more to unlock <strong>FREE Shipping!</strong>`;
      elements.shippingProgressFill.style.width = `${totals.freeShippingProgress}%`;
    } else {
      elements.shippingProgressText.className = 'shipping-progress-text';
      elements.shippingProgressText.innerHTML = `Add <strong>$100.00</strong> more to unlock <strong>FREE Shipping!</strong>`;
      elements.shippingProgressFill.style.width = '0%';
    }
  }

  // 6. Cart Items View / Empty View
  if (items.length === 0) {
    if (elements.cartEmptyState) elements.cartEmptyState.classList.remove('hidden');
    if (elements.cartItemsList) {
      elements.cartItemsList.classList.add('hidden');
      elements.cartItemsList.innerHTML = '';
    }
    if (elements.proceedCheckoutBtn) elements.proceedCheckoutBtn.disabled = true;
  } else {
    if (elements.cartEmptyState) elements.cartEmptyState.classList.add('hidden');
    if (elements.cartItemsList) {
      elements.cartItemsList.classList.remove('hidden');
      renderCartItems(items);
    }
    if (elements.proceedCheckoutBtn) elements.proceedCheckoutBtn.disabled = false;
  }

  // 7. Cart Drawer Totals
  if (elements.cartSubtotalVal) elements.cartSubtotalVal.textContent = totals.formattedSubtotal || '$0.00';
  if (elements.cartTaxVal) elements.cartTaxVal.textContent = totals.formattedTax || '$0.00';
  if (elements.cartShippingVal) {
    elements.cartShippingVal.textContent = totals.formattedShipping || '$0.00';
    if (totals.formattedShipping === 'FREE') {
      elements.cartShippingVal.style.color = 'var(--accent-emerald-dark)';
      elements.cartShippingVal.style.fontWeight = '700';
    } else {
      elements.cartShippingVal.style.color = '';
      elements.cartShippingVal.style.fontWeight = '';
    }
  }
  if (elements.cartTotalVal) elements.cartTotalVal.textContent = totals.formattedTotal || '$0.00';

  // 8. Synchronize Checkout Sidebar Totals if checkout is open
  syncCheckoutSummary(items, totals);
}

/**
 * Renders individual cart item rows inside the drawer
 */
function renderCartItems(items = []) {
  if (!elements.cartItemsList) return;
  elements.cartItemsList.innerHTML = '';

  items.forEach(item => {
    const li = document.createElement('li');
    li.className = 'cart-item';
    li.setAttribute('data-id', item.id);

    const priceCents = Math.round(item.price * 100);
    const lineTotal = formatPrice((priceCents * item.quantity) / 100);

    li.innerHTML = `
      <div class="cart-item-img-box">
        <img 
          src="${escapeHtml(item.image)}" 
          alt="${escapeHtml(item.title)}" 
          class="cart-item-img"
          onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2260%22 height=%2260%22 viewBox=%220 0 60 60%22><rect width=%2260%22 height=%2260%22 fill=%22%23f1f5f9%22/><text x=%2250%%22 y=%2250%%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-family=%22sans-serif%22 font-size=%228%22 fill=%22%2394a3b8%22>Item</text></svg>'"
        >
      </div>
      <div class="cart-item-details">
        <div class="cart-item-top">
          <h4 class="cart-item-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</h4>
          <button 
            type="button" 
            class="cart-item-remove-btn" 
            data-id="${item.id}"
            aria-label="Remove ${escapeHtml(item.title)} from cart"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
        <div class="cart-item-unit-price">${formatPrice(item.price)} each</div>
        <div class="cart-item-bottom">
          <div class="quantity-stepper" role="group" aria-label="Quantity for ${escapeHtml(item.title)}">
            <button 
              type="button" 
              class="stepper-btn stepper-minus" 
              data-id="${item.id}" 
              data-action="decrease"
              aria-label="Decrease quantity"
            >-</button>
            <span class="stepper-qty" aria-live="polite">${item.quantity}</span>
            <button 
              type="button" 
              class="stepper-btn stepper-plus" 
              data-id="${item.id}" 
              data-action="increase"
              aria-label="Increase quantity"
            >+</button>
          </div>
          <span class="cart-item-total-price">${lineTotal}</span>
        </div>
      </div>
    `;

    elements.cartItemsList.appendChild(li);
  });
}

/**
 * Synchronizes checkout modal order summary
 */
function syncCheckoutSummary(items = [], totals = {}) {
  if (!elements.checkoutItemsPreview) return;

  elements.checkoutItemsPreview.innerHTML = '';
  items.forEach(item => {
    const row = document.createElement('div');
    row.className = 'checkout-preview-item';
    const priceCents = Math.round(item.price * 100);
    const itemTotal = formatPrice((priceCents * item.quantity) / 100);

    row.innerHTML = `
      <img src="${escapeHtml(item.image)}" alt="${escapeHtml(item.title)}" class="checkout-preview-img">
      <span class="checkout-preview-title" title="${escapeHtml(item.title)}">${escapeHtml(item.title)}</span>
      <span class="checkout-preview-qty">x${item.quantity}</span>
      <span class="checkout-preview-price">${itemTotal}</span>
    `;
    elements.checkoutItemsPreview.appendChild(row);
  });

  if (elements.checkoutSubtotalVal) elements.checkoutSubtotalVal.textContent = totals.formattedSubtotal || '$0.00';
  if (elements.checkoutTaxVal) elements.checkoutTaxVal.textContent = totals.formattedTax || '$0.00';
  if (elements.checkoutShippingVal) elements.checkoutShippingVal.textContent = totals.formattedShipping || '$0.00';
  if (elements.checkoutTotalVal) elements.checkoutTotalVal.textContent = totals.formattedTotal || '$0.00';
}

// ============================================================================
// Modal & Drawer Open / Close Helpers
// ============================================================================
function openCartDrawer() {
  if (!elements.cartDrawer || !elements.cartBackdrop) return;
  elements.cartDrawer.classList.add('open');
  elements.cartDrawer.setAttribute('aria-hidden', 'false');
  elements.cartBackdrop.classList.add('active');
  document.body.classList.add('lock-scroll');
  if (elements.cartTriggerBtn) elements.cartTriggerBtn.setAttribute('aria-expanded', 'true');
}

function closeCartDrawer() {
  if (!elements.cartDrawer || !elements.cartBackdrop) return;
  elements.cartDrawer.classList.remove('open');
  elements.cartDrawer.setAttribute('aria-hidden', 'true');
  elements.cartBackdrop.classList.remove('active');
  document.body.classList.remove('lock-scroll');
  if (elements.cartTriggerBtn) elements.cartTriggerBtn.setAttribute('aria-expanded', 'false');
}

function openCheckoutModal() {
  if (cartManager.getItemCount() === 0) {
    showToast('Your cart is empty. Add products to checkout!', 'error');
    return;
  }

  closeCartDrawer();

  if (!elements.checkoutModal || !elements.modalBackdrop) return;
  // Reset view to form
  if (elements.checkoutFormView) elements.checkoutFormView.classList.remove('hidden');
  if (elements.checkoutSuccessView) elements.checkoutSuccessView.classList.add('hidden');
  
  elements.checkoutModal.classList.add('active');
  elements.checkoutModal.setAttribute('aria-hidden', 'false');
  elements.modalBackdrop.classList.add('active');
  document.body.classList.add('lock-scroll');

  // Focus first input
  const firstInput = document.getElementById('checkout-name');
  if (firstInput) setTimeout(() => firstInput.focus(), 100);
}

function closeCheckoutModal() {
  if (!elements.checkoutModal || !elements.modalBackdrop) return;
  elements.checkoutModal.classList.remove('active');
  elements.checkoutModal.setAttribute('aria-hidden', 'true');
  elements.modalBackdrop.classList.remove('active');
  document.body.classList.remove('lock-scroll');
}

function openQuickView(productId) {
  const product = allProducts.find(p => String(p.id) === String(productId));
  if (!product || !elements.quickViewModal || !elements.quickViewBody) return;

  quickViewSelectedProduct = product;
  quickViewQuantity = 1;

  const categoryName = formatCategoryDisplayName(product.category);
  const ratingRate = product.rating ? product.rating.rate : 0;
  const ratingCount = product.rating ? product.rating.count : 0;

  elements.quickViewBody.innerHTML = `
    <div class="qv-media">
      <img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.title)}" class="qv-image">
    </div>
    <div class="qv-info">
      <span class="category-badge ${getCategoryBadgeClass(product.category)}">${escapeHtml(categoryName)}</span>
      <h2 id="quick-view-title" class="qv-title">${escapeHtml(product.title)}</h2>
      <div class="card-rating-row" style="margin-bottom: 0.85rem;">
        <div class="rating-stars">${renderRatingStars(ratingRate)}</div>
        <span class="rating-score">${ratingRate.toFixed(1)}</span>
        <span class="rating-count">(${ratingCount} verified customer reviews)</span>
      </div>
      <p class="qv-description">${escapeHtml(product.description || 'Premium quality product crafted with superior materials and design.')}</p>
      <div class="qv-price-row">
        <span class="card-price-label">Price:</span>
        <span class="qv-price">${formatPrice(product.price)}</span>
      </div>
      <div class="qv-actions">
        <div class="quantity-stepper" role="group" aria-label="Quantity">
          <button type="button" class="stepper-btn" id="qv-minus-btn" aria-label="Decrease quantity">-</button>
          <span class="stepper-qty" id="qv-qty-val">1</span>
          <button type="button" class="stepper-btn" id="qv-plus-btn" aria-label="Increase quantity">+</button>
        </div>
        <button type="button" class="btn btn-primary btn-lg" id="qv-add-btn">
          <span>Add to Cart</span>
        </button>
      </div>
    </div>
  `;

  // Wire up quantity buttons inside modal
  const minusBtn = document.getElementById('qv-minus-btn');
  const plusBtn = document.getElementById('qv-plus-btn');
  const qtyVal = document.getElementById('qv-qty-val');
  const addBtn = document.getElementById('qv-add-btn');

  if (minusBtn && plusBtn && qtyVal) {
    minusBtn.addEventListener('click', () => {
      if (quickViewQuantity > 1) {
        quickViewQuantity--;
        qtyVal.textContent = String(quickViewQuantity);
      }
    });

    plusBtn.addEventListener('click', () => {
      quickViewQuantity++;
      qtyVal.textContent = String(quickViewQuantity);
    });
  }

  if (addBtn) {
    addBtn.addEventListener('click', () => {
      cartManager.addToCart(quickViewSelectedProduct, quickViewQuantity);
      showToast(`Added ${quickViewQuantity} item(s) to cart!`);
      closeQuickView();
      openCartDrawer();
    });
  }

  elements.quickViewModal.classList.add('active');
  elements.quickViewModal.setAttribute('aria-hidden', 'false');
  elements.modalBackdrop.classList.add('active');
  document.body.classList.add('lock-scroll');
}

function closeQuickView() {
  if (!elements.quickViewModal || !elements.modalBackdrop) return;
  elements.quickViewModal.classList.remove('active');
  elements.quickViewModal.setAttribute('aria-hidden', 'true');
  elements.modalBackdrop.classList.remove('active');
  document.body.classList.remove('lock-scroll');
  quickViewSelectedProduct = null;
}

function closeAllModals() {
  closeCartDrawer();
  closeCheckoutModal();
  closeQuickView();
}

// ============================================================================
// Event Listeners Setup
// ============================================================================
function setupEventListeners() {
  // 1. Search Inputs Synchronization (Desktop + Mobile)
  const handleSearchChange = debounce((val) => {
    searchQuery = val.trim();
    if (elements.navSearchInput && elements.navSearchInput.value !== val) {
      elements.navSearchInput.value = val;
    }
    if (elements.mobileSearchInput && elements.mobileSearchInput.value !== val) {
      elements.mobileSearchInput.value = val;
    }

    // Toggle clear buttons
    const hasText = searchQuery.length > 0;
    if (elements.searchClearBtn) elements.searchClearBtn.classList.toggle('hidden', !hasText);
    if (elements.mobileSearchClearBtn) elements.mobileSearchClearBtn.classList.toggle('hidden', !hasText);

    renderProducts();
  }, 120);

  if (elements.navSearchInput) {
    elements.navSearchInput.addEventListener('input', (e) => handleSearchChange(e.target.value));
  }

  if (elements.mobileSearchInput) {
    elements.mobileSearchInput.addEventListener('input', (e) => handleSearchChange(e.target.value));
  }

  // Clear Search Buttons
  if (elements.searchClearBtn) {
    elements.searchClearBtn.addEventListener('click', () => {
      if (elements.navSearchInput) elements.navSearchInput.value = '';
      if (elements.mobileSearchInput) elements.mobileSearchInput.value = '';
      searchQuery = '';
      elements.searchClearBtn.classList.add('hidden');
      if (elements.mobileSearchClearBtn) elements.mobileSearchClearBtn.classList.add('hidden');
      renderProducts();
      if (elements.navSearchInput) elements.navSearchInput.focus();
    });
  }

  if (elements.mobileSearchClearBtn) {
    elements.mobileSearchClearBtn.addEventListener('click', () => {
      if (elements.navSearchInput) elements.navSearchInput.value = '';
      if (elements.mobileSearchInput) elements.mobileSearchInput.value = '';
      searchQuery = '';
      elements.mobileSearchClearBtn.classList.add('hidden');
      if (elements.searchClearBtn) elements.searchClearBtn.classList.add('hidden');
      renderProducts();
      if (elements.mobileSearchInput) elements.mobileSearchInput.focus();
    });
  }

  // Mobile Search Bar Toggle
  if (elements.mobileSearchToggle && elements.mobileSearchBar) {
    elements.mobileSearchToggle.addEventListener('click', () => {
      elements.mobileSearchBar.classList.toggle('hidden');
      if (!elements.mobileSearchBar.classList.contains('hidden') && elements.mobileSearchInput) {
        elements.mobileSearchInput.focus();
      }
    });
  }

  // 2. Category Filter Buttons
  if (elements.categoryButtons) {
    elements.categoryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const cat = btn.getAttribute('data-category') || 'all';
        currentCategory = cat;

        elements.categoryButtons.forEach(b => {
          const isActive = b === btn;
          b.classList.toggle('active', isActive);
          b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
        });

        renderProducts();
      });
    });
  }

  // 3. Footer Category Links
  document.querySelectorAll('.footer-cat-link').forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.getAttribute('data-category') || 'all';
      currentCategory = cat;

      elements.categoryButtons.forEach(b => {
        const isActive = b.getAttribute('data-category') === cat;
        b.classList.toggle('active', isActive);
        b.setAttribute('aria-pressed', isActive ? 'true' : 'false');
      });

      renderProducts();
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    });
  });

  // 4. Sort Dropdown
  if (elements.sortSelect) {
    elements.sortSelect.addEventListener('change', (e) => {
      currentSort = e.target.value;
      renderProducts();
    });
  }

  // 5. Active Filters Chips & Reset All
  if (elements.activeFiltersBar) {
    elements.activeFiltersBar.addEventListener('click', (e) => {
      const action = e.target.getAttribute('data-action');
      if (action === 'clear-category') {
        currentCategory = 'all';
        elements.categoryButtons.forEach(b => {
          const isAll = b.getAttribute('data-category') === 'all';
          b.classList.toggle('active', isAll);
          b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
        });
        renderProducts();
      } else if (action === 'clear-search') {
        searchQuery = '';
        if (elements.navSearchInput) elements.navSearchInput.value = '';
        if (elements.mobileSearchInput) elements.mobileSearchInput.value = '';
        if (elements.searchClearBtn) elements.searchClearBtn.classList.add('hidden');
        if (elements.mobileSearchClearBtn) elements.mobileSearchClearBtn.classList.add('hidden');
        renderProducts();
      }
    });
  }

  if (elements.resetAllFiltersBtn) {
    elements.resetAllFiltersBtn.addEventListener('click', resetAllFilters);
  }

  if (elements.clearSearchBtn) {
    elements.clearSearchBtn.addEventListener('click', resetAllFilters);
  }

  // 6. Product Grid Delegate (Add to Cart & Quick View)
  if (elements.productsGrid) {
    elements.productsGrid.addEventListener('click', (e) => {
      const addBtn = e.target.closest('.card-add-btn');
      if (addBtn) {
        const productId = addBtn.getAttribute('data-id');
        const product = allProducts.find(p => String(p.id) === String(productId));
        if (product) {
          cartManager.addToCart(product, 1);
          showToast(`Added "${product.title}" to cart!`);
        }
        return;
      }

      const qvBtn = e.target.closest('.card-quick-view-btn');
      if (qvBtn) {
        const productId = qvBtn.getAttribute('data-id');
        openQuickView(productId);
      }
    });
  }

  // 7. Cart Drawer Triggers & Controls
  if (elements.cartTriggerBtn) {
    elements.cartTriggerBtn.addEventListener('click', openCartDrawer);
  }

  if (elements.heroCartCta) {
    elements.heroCartCta.addEventListener('click', openCartDrawer);
  }

  if (elements.cartCloseBtn) {
    elements.cartCloseBtn.addEventListener('click', closeCartDrawer);
  }

  if (elements.cartBackdrop) {
    elements.cartBackdrop.addEventListener('click', closeCartDrawer);
  }

  if (elements.startShoppingBtn) {
    elements.startShoppingBtn.addEventListener('click', () => {
      closeCartDrawer();
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 8. Cart Items Actions (Quantity Stepper & Remove)
  if (elements.cartItemsList) {
    elements.cartItemsList.addEventListener('click', (e) => {
      // Stepper decrease
      const minusBtn = e.target.closest('.stepper-minus');
      if (minusBtn) {
        const id = minusBtn.getAttribute('data-id');
        const item = cartManager.getItems().find(p => String(p.id) === String(id));
        if (item) {
          const newQty = item.quantity - 1;
          cartManager.updateQuantity(id, newQty);
          if (newQty <= 0) {
            showToast(`Removed "${item.title}" from cart`);
          }
        }
        return;
      }

      // Stepper increase
      const plusBtn = e.target.closest('.stepper-plus');
      if (plusBtn) {
        const id = plusBtn.getAttribute('data-id');
        const item = cartManager.getItems().find(p => String(p.id) === String(id));
        if (item) {
          cartManager.updateQuantity(id, item.quantity + 1);
        }
        return;
      }

      // Remove button
      const removeBtn = e.target.closest('.cart-item-remove-btn');
      if (removeBtn) {
        const id = removeBtn.getAttribute('data-id');
        const item = cartManager.getItems().find(p => String(p.id) === String(id));
        if (item) {
          cartManager.removeFromCart(id);
          showToast(`Removed "${item.title}" from cart`);
        }
      }
    });
  }

  // 9. Clear Cart Button
  if (elements.clearCartBtn) {
    elements.clearCartBtn.addEventListener('click', () => {
      if (cartManager.getItemCount() === 0) return;
      if (confirm('Are you sure you want to empty your shopping cart?')) {
        cartManager.clearCart();
        showToast('Shopping cart cleared');
      }
    });
  }

  // 10. Proceed to Checkout Button
  if (elements.proceedCheckoutBtn) {
    elements.proceedCheckoutBtn.addEventListener('click', openCheckoutModal);
  }

  // 11. Checkout Modal Actions & Form Validation
  if (elements.checkoutCloseBtn) {
    elements.checkoutCloseBtn.addEventListener('click', closeCheckoutModal);
  }

  if (elements.cancelCheckoutBtn) {
    elements.cancelCheckoutBtn.addEventListener('click', () => {
      closeCheckoutModal();
      openCartDrawer();
    });
  }

  if (elements.checkoutForm) {
    elements.checkoutForm.addEventListener('submit', handleCheckoutSubmit);
  }

  if (elements.continueShoppingBtn) {
    elements.continueShoppingBtn.addEventListener('click', () => {
      closeCheckoutModal();
      const catalogEl = document.getElementById('catalog-section');
      if (catalogEl) catalogEl.scrollIntoView({ behavior: 'smooth' });
    });
  }

  // 12. Quick View Modal Close
  if (elements.quickViewCloseBtn) {
    elements.quickViewCloseBtn.addEventListener('click', closeQuickView);
  }

  if (elements.modalBackdrop) {
    elements.modalBackdrop.addEventListener('click', () => {
      closeCheckoutModal();
      closeQuickView();
    });
  }

  // 13. Retry Fetch Button
  if (elements.retryFetchBtn) {
    elements.retryFetchBtn.addEventListener('click', loadProductsFromAPI);
  }

  // 14. Global Keyboard Navigation (Escape key)
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' || e.key === 'Esc') {
      closeAllModals();
    }
  });
}

/**
 * Resets category, search, and sort filters to defaults
 */
function resetAllFilters() {
  currentCategory = 'all';
  searchQuery = '';
  currentSort = 'featured';

  if (elements.navSearchInput) elements.navSearchInput.value = '';
  if (elements.mobileSearchInput) elements.mobileSearchInput.value = '';
  if (elements.searchClearBtn) elements.searchClearBtn.classList.add('hidden');
  if (elements.mobileSearchClearBtn) elements.mobileSearchClearBtn.classList.add('hidden');

  if (elements.categoryButtons) {
    elements.categoryButtons.forEach(b => {
      const isAll = b.getAttribute('data-category') === 'all';
      b.classList.toggle('active', isAll);
      b.setAttribute('aria-pressed', isAll ? 'true' : 'false');
    });
  }

  if (elements.sortSelect) elements.sortSelect.value = 'featured';

  renderProducts();
}

/**
 * Simulated Checkout Form Submission Handler
 */
function handleCheckoutSubmit(e) {
  e.preventDefault();

  const form = elements.checkoutForm;
  const nameInput = form.querySelector('#checkout-name');
  const emailInput = form.querySelector('#checkout-email');
  const addressInput = form.querySelector('#checkout-address');
  const cityInput = form.querySelector('#checkout-city');
  const postalInput = form.querySelector('#checkout-postal');

  let isValid = true;

  // Simple validation checks
  const validateField = (input, condition) => {
    if (!condition) {
      input.classList.add('invalid');
      isValid = false;
    } else {
      input.classList.remove('invalid');
    }
  };

  validateField(nameInput, nameInput.value.trim().length >= 2);
  validateField(emailInput, /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim()));
  validateField(addressInput, addressInput.value.trim().length >= 4);
  validateField(cityInput, cityInput.value.trim().length >= 2);
  validateField(postalInput, postalInput.value.trim().length >= 2);

  if (!isValid) {
    const firstInvalid = form.querySelector('.invalid');
    if (firstInvalid) firstInvalid.focus();
    return;
  }

  // Show processing spinner
  if (elements.placeOrderBtn && elements.placeOrderText && elements.placeOrderSpinner) {
    elements.placeOrderBtn.disabled = true;
    elements.placeOrderText.textContent = 'Processing Order...';
    elements.placeOrderSpinner.classList.remove('hidden');
  }

  // Simulate network delay for authorization
  setTimeout(() => {
    const totals = cartManager.calculateTotal();
    const orderId = `SP-2026-${Math.floor(100000 + Math.random() * 900000)}`;

    // Populate receipt confirmation
    if (elements.receiptOrderId) elements.receiptOrderId.textContent = orderId;
    if (elements.receiptCustomerName) elements.receiptCustomerName.textContent = nameInput.value.trim();
    if (elements.receiptCustomerEmail) elements.receiptCustomerEmail.textContent = emailInput.value.trim();
    if (elements.receiptTotalPaid) elements.receiptTotalPaid.textContent = totals.formattedTotal;
    
    // Estimated delivery date (3-5 business days out)
    const delivery = new Date();
    delivery.setDate(delivery.getDate() + 4);
    if (elements.receiptDeliveryDate) {
      elements.receiptDeliveryDate.textContent = delivery.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    }

    // CLEAR CART ONLY AFTER USER CONFIRMS SIMULATED ORDER!
    cartManager.clearCart();

    // Reset button state
    if (elements.placeOrderBtn && elements.placeOrderText && elements.placeOrderSpinner) {
      elements.placeOrderBtn.disabled = false;
      elements.placeOrderText.textContent = 'Place Simulated Order';
      elements.placeOrderSpinner.classList.add('hidden');
    }

    // Switch view to Confirmation Screen
    if (elements.checkoutFormView) elements.checkoutFormView.classList.add('hidden');
    if (elements.checkoutSuccessView) elements.checkoutSuccessView.classList.remove('hidden');

    form.reset();
  }, 900);
}

// ============================================================================
// API Fetch & Initial Load
// ============================================================================
async function loadProductsFromAPI() {
  if (elements.networkErrorState) elements.networkErrorState.classList.add('hidden');
  if (elements.emptyResultsState) elements.emptyResultsState.classList.add('hidden');
  renderLoadingSkeletons(8);

  try {
    const products = await fetchProducts();
    allProducts = products;
    renderProducts();
  } catch (error) {
    console.error('Failed to load products from FakeStoreAPI:', error);
    if (elements.productsGrid) elements.productsGrid.innerHTML = '';
    if (elements.networkErrorState) {
      elements.networkErrorState.classList.remove('hidden');
      if (elements.errorMessageText) {
        elements.errorMessageText.textContent = error.message || 'Unable to fetch products. Please verify your connection.';
      }
    }
  }
}

// ============================================================================
// Application Bootstrap
// ============================================================================
function initApp() {
  setupEventListeners();
  // Synchronize cart with stored items immediately
  updateCartUI(cartManager.getItems(), cartManager.calculateTotal());
  // Fetch real products from FakeStoreAPI
  loadProductsFromAPI();
}

// Run when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initApp);
} else {
  initApp();
}

// Export for module inspection if needed
export {
  cartManager,
  formatPrice,
  allProducts
};

