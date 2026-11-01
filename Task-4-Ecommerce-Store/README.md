# ShopSphere — Premium E-Commerce Storefront

> **Datheon Full Stack Web Development Internship &bull; Task 4**  
> **Official Objective:** E-Commerce Product Catalog and Interactive Shopping Cart.

[![Automated Tests](https://img.shields.io/badge/tests-57%20passing-success.svg)](#automated-testing)
[![Tech Stack](https://img.shields.io/badge/tech%20stack-HTML5%20%7C%20CSS3%20%7C%20Vanilla%20JS%20(ES6%2B)-indigo.svg)](#technology-stack)
[![API](https://img.shields.io/badge/api-FakeStoreAPI-orange.svg)](https://fakestoreapi.com/products)
[![Deployment](https://img.shields.io/badge/deployment-Vercel%20Ready-black.svg)](#vercel-deployment-guide)

---

## 🌟 Executive Summary

**ShopSphere** is a modern, responsive, high-performance e-commerce storefront engineered with vanilla web standards (HTML5, CSS3, ES6+ JavaScript). It connects directly to the live [FakeStoreAPI](https://fakestoreapi.com/products) to display curated products, featuring live multi-category filtering, instant debounced search, integer-based monetary calculations to eliminate floating-point drift, a persistent slide-out shopping cart drawer with `localStorage`, and an interactive simulated checkout workflow.

---

## 🚀 Key Features

### 1. Modern UI / UX Design & Architecture
- **Responsive Sticky Header:** Features the ShopSphere brand identity, desktop & mobile search bar, navigation links, and an interactive shopping cart button.
- **Cart Badge Indicator:** Real-time item count badge with animated pulse feedback whenever products are added or updated.
- **Hero Section:** Conversion-oriented layout with value propositions, trust badges (Free Shipping on orders \$100+, transparent 8% tax), and direct call-to-actions.
- **Micro-Interactions & Transitions:** Card hover elevations, image zoom effects, shimmer skeleton loaders during fetch states, and non-blocking toast notifications.
- **Slide-Out Shopping Cart Drawer:** Smooth right-side drawer transition, backdrop blur overlay, quantity steppers, free shipping progress bar, individual item removal, and full order summary.
- **Quick View Modal:** In-depth product preview modal showing high-res imagery, rating breakdowns, verified reviews, full description, quantity selector, and instant add-to-cart.
- **Simulated Checkout Modal:** Comprehensive checkout simulation featuring shipping/contact information validation, test payment methods, live order summary, and order confirmation receipt.
- **Mobile-First Responsiveness:** Thoroughly tested and verified across mobile (360px), tablet (768px), desktop (1024px), and ultra-wide (1440px+) viewports with zero horizontal overflow.

### 2. Live API Integration & Resilience
- **Endpoint:** Connects to `https://fakestoreapi.com/products` via asynchronous `fetch()` and `async/await`.
- **Loading Skeletons:** Renders 8 shimmering placeholder cards while awaiting network responses.
- **Strict Data Validation:** Schema validation in `js/api.js` verifying types, non-empty titles, valid numerical prices, category strings, and rating objects.
- **Graceful Error Handling & Retry:** Friendly network error state with a dedicated **Retry Connection** button.
- **Empty State Display:** Displays an informative empty state when no products match the combined search and category criteria.
- **Strict Integrity Rule:** No fake products are hardcoded as mock API data.

### 3. Real-Time Search, Filtering & Sorting
- **Categories Supported:**
  - `All Products` (`all`)
  - `Electronics` (`electronics`)
  - `Jewelry` (`jewelery`)
  - `Men's Clothing` (`men's clothing`)
  - `Women's Clothing` (`women's clothing`)
- **Simultaneous Filtering:** Search query and category filter work together dynamically.
- **Debounced Title Search:** Instant search by product title with clear (`✕`) button and synchronized desktop/mobile inputs.
- **Dynamic Product Sorting:**
  - Featured / Default (API order)
  - Price: Low to High
  - Price: High to Low
  - Highest Rated
  - Product Name: A to Z
- **Active Filter Chips:** Displays active filter badges with one-click individual chip removal and a global "Clear all filters" control.

### 4. Interactive Shopping Cart Engine
- **Required Core Functions Implemented:**
  - `addToCart(product)`: Appends new product or increments existing product quantity.
  - `removeFromCart(productId)`: Removes the specified product completely.
  - `updateQuantity(productId, quantity)`: Updates quantity; automatically removes item if quantity $\le 0$.
  - `calculateTotal()`: Computes subtotal, tax, shipping, and grand total in integer cents.
  - `saveCart()`: Serializes cart state to `localStorage`.
  - `loadCart()`: Hydrates cart state from `localStorage` with data sanitization.
- **Integer Cents Monetary Engine:**
  - Internal calculations use `Math.round(price * 100)` to eliminate binary floating-point drift (e.g. `0.1 + 0.2 === 0.30000000000000004`).
- **Pricing & Shipping Rules:**
  - **Subtotal:** Sum of all `priceInCents * quantity`.
  - **Tax Rate:** Exact 8% of subtotal (`Math.round(subtotalCents * 0.08)`).
  - **Shipping Rule:**
    - Cart empty: **\$0.00**
    - Subtotal $<$ \$100.00: **\$10.00 standard shipping**
    - Subtotal $\ge$ \$100.00: **FREE shipping unlocked!**
- **Dynamic Free Shipping Progress Bar:**
  - Shows exact remaining amount needed: e.g., *"Add \$35.50 more to unlock FREE Shipping!"*
  - Automatically turns emerald green with a celebratory badge when unlocked.

### 5. Simulated Checkout Workflow
- **Demo Mode Transparency:** Prominently alerts users that checkout is a simulated demonstration; no real financial transactions take place.
- **Customer Form Validation:** Validates full name, email address, street address, city, and postal code.
- **Simulated Payment Options:** Demo Credit Card (•••• 4242) and Cash on Delivery (Simulated).
- **Cart Clearing Rule:** Cart state is cleared **only after** the user confirms the order.
- **Order Confirmation Receipt:** Displays unique Order Reference ID (e.g., `SP-2026-847291`), customer details, delivery estimate (3–5 business days), and paid breakdown.

### 6. Accessibility & Web Quality (WCAG 2.1 AA)
- **Semantic HTML5:** `<header>`, `<nav>`, `<main>`, `<section>`, `<article>`, `<aside>`, `<footer>`.
- **Keyboard Navigation:** Full Tab order, visible focus rings (`:focus-visible`), and `Escape` key listeners to dismiss modals and drawers.
- **ARIA Attributes:** `role="dialog"`, `aria-modal="true"`, `aria-live="polite"`, `aria-pressed`, `aria-busy`.
- **Accessible Images:** Informative `alt` text and graceful SVG image fallback for broken image URLs.

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Markup** | HTML5 | Semantic landmarks, accessible forms, SVG icons |
| **Styling** | CSS3 | Custom properties, CSS Grid, Flexbox, media queries (360px, 768px, 1440px), shimmer animations |
| **Logic** | Vanilla JavaScript (ES6+) | Modular ES modules, Async/Await, Fetch API, LocalStorage |
| **API** | FakeStoreAPI | `https://fakestoreapi.com/products` |
| **Testing** | Node.js Test Runner | Native `node:test` and `node:assert/strict` (57 tests passing) |
| **Hosting** | Vercel | Static zero-configuration deployment ready |

---

## 📁 Project Structure

```text
Task-4-Ecommerce-Store/
├── assets/
│   └── logo.svg                 # Brand SVG icon
├── js/
│   ├── api.js                   # API client, network fetch, schema validator
│   ├── cart.js                  # Cart business logic & integer cents pricing engine
│   └── filters.js               # Category filter, search, and sorting algorithms
├── tests/
│   ├── api.test.js              # API validation & network mock tests
│   ├── cart.test.js             # Cart CRUD, quantity clamps, and manager tests
│   ├── filters.test.js          # Search, category matching, and sorting tests
│   ├── persistence.test.js      # LocalStorage serialization & corruption recovery
│   └── pricing.test.js          # Integer cents, 8% tax, and shipping rules tests
├── .gitignore                   # Ignored files (node_modules, logs, .vercel)
├── app.js                       # Main application controller & DOM orchestrator
├── index.html                   # Semantic HTML5 single-page application entrypoint
├── package.json                 # Project configuration & test scripts
├── README.md                    # Comprehensive documentation
└── styles.css                   # Responsive design system, tokens, and animations
```

---

## 🧪 Automated Testing

The project includes an automated unit test suite built with Node's native test runner (`node:test` and `node:assert/strict`), requiring zero external dependencies.

### Covered Test Scenarios:
1. **`addToCart()`**:
   - Adding a new product to an empty cart with default quantity 1.
   - Incrementing item quantity when existing product is added again.
   - Adding multiple distinct products.
   - Safely rejecting `null`, `undefined`, or malformed product payloads without throwing.
2. **`removeFromCart()`**:
   - Removing item by ID (numeric or string representation).
   - Leaving other items intact.
   - Safely handling non-existent product IDs.
3. **`updateQuantity()`**:
   - Updating quantity to valid positive integers.
   - Automatically removing item if quantity is set to 0 or negative.
   - Discarding NaN and non-numeric inputs.
4. **`calculateTotal()` & Pricing Engine**:
   - Zero totals on empty cart (\$0.00 subtotal, \$0.00 tax, \$0.00 shipping, \$0.00 total).
   - Standard shipping (\$10.00) on orders strictly below \$100.00.
   - Free shipping qualification on orders equal to or greater than \$100.00.
   - Exact 8% tax calculation on subtotal.
   - Integer cents arithmetic preventing floating-point drift (e.g. \$19.99 $\times$ 3 + \$9.99 $\times$ 2).
   - Free shipping threshold percentage and dollar amount remaining.
5. **Cart Persistence**:
   - Accurate serialization and deserialization via `saveCart()` and `loadCart()`.
   - Handling empty or missing storage keys.
   - Graceful recovery from corrupt/invalid JSON payloads.
   - Filtering out malformed or corrupted items during hydration.
6. **Filtering & Search**:
   - Category matching across exact FakeStoreAPI values (`electronics`, `jewelery`, `men's clothing`, `women's clothing`).
   - Normalization for American vs API spelling (`jewelry` vs `jewelery`).
   - Case-insensitive title substring search with whitespace trimming.
   - Combined category filtering and title search working simultaneously.
   - Multi-property sorting (Price Asc/Desc, Highest Rating, Name A-Z).
7. **API Validation**:
   - Validating schema of raw FakeStoreAPI product objects.
   - Rejecting non-array API payloads.
   - Filtering valid items and dropping corrupted elements.
   - Handling HTTP error status codes (e.g. 500) and network failures.

### Running the Test Suite:
Run the tests locally with Node.js (v18+ or v22+):

```bash
npm test
```

### Actual Test Execution Output:
```text
> shopsphere-ecommerce-store@1.0.0 test
> node --test tests/*.test.js

TAP version 13
# Subtest: API Validation: validateProduct()
    ok 1 - accepts a well-formed product from FakeStoreAPI
    ok 2 - rejects null or non-object payloads
    ok 3 - rejects missing or empty title
    ok 4 - rejects missing, NaN, or negative prices
    ok 5 - rejects missing category or image
ok 1 - API Validation: validateProduct()

# Subtest: API Validation: validateProducts()
    ok 1 - throws error if response is not an array
    ok 2 - returns empty array when given an empty array
    ok 3 - filters valid products and drops corrupted elements
    ok 4 - throws error if all items in non-empty array are invalid
ok 2 - API Validation: validateProducts()

# Subtest: API Client: fetchProducts() with mocked responses
    ok 1 - successfully fetches and validates products from mock fetch
    ok 2 - throws error when server responds with HTTP error code (e.g. 500)
    ok 3 - propagates network failure gracefully
ok 3 - API Client: fetchProducts() with mocked responses

# Subtest: Shopping Cart: addToCart() functionality
    ok 1 - adds a new product to an empty cart with default quantity 1
    ok 2 - increments quantity when existing product is added again
    ok 3 - adds multiple distinct products to cart
    ok 4 - safely handles null or invalid product without throwing
ok 4 - Shopping Cart: addToCart() functionality

# Subtest: Shopping Cart: removeFromCart() functionality
    ok 1 - removes item by ID from cart
    ok 2 - works with string or numeric ID types
    ok 3 - leaves cart unchanged if productId is not found
ok 5 - Shopping Cart: removeFromCart() functionality

# Subtest: Shopping Cart: updateQuantity() functionality
    ok 1 - updates quantity to valid positive integers
    ok 2 - automatically removes item if quantity is updated to 0 or less
    ok 3 - ignores invalid or NaN quantities without corrupting state
ok 6 - Shopping Cart: updateQuantity() functionality

# Subtest: Shopping Cart: CartManager instance methods
ok 7 - Shopping Cart: CartManager instance methods

# Subtest: Category Filtering: matchesCategory()
    ok 1 - matches all products when category is "all"
    ok 2 - accurately filters by exact FakeStoreAPI categories
    ok 3 - handles case-insensitivity and American vs API spelling ("jewelry" vs "jewelery")
ok 8 - Category Filtering: matchesCategory()

# Subtest: Product Search: matchesSearch()
    ok 1 - searches product title case-insensitively
    ok 2 - matches partial substrings and trims whitespace
    ok 3 - returns empty array when search query matches no products
    ok 4 - returns all products when search query is empty or whitespace
ok 9 - Product Search: matchesSearch()

# Subtest: Combined Filter and Search: filterProducts()
    ok 1 - filters by category AND search simultaneously
ok 10 - Combined Filter and Search: filterProducts()

# Subtest: Product Sorting: sortProducts()
    ok 1 - sorts by price low-to-high
    ok 2 - sorts by price high-to-low
    ok 3 - sorts by highest rating
    ok 4 - sorts alphabetically by title
ok 11 - Product Sorting: sortProducts()

# Subtest: Cart Persistence: saveCartToStorage and loadCartFromStorage
    ok 1 - saves cart to storage and loads it back accurately
    ok 2 - returns empty array when storage key is missing or empty
    ok 3 - gracefully recovers from corrupt JSON data in storage
    ok 4 - filters out invalid items during load to prevent state corruption
    ok 5 - handles storage being null or undefined without throwing errors
ok 12 - Cart Persistence: saveCartToStorage and loadCartFromStorage

# Subtest: Pricing & Calculation Rules: calculateTotal()
    ok 1 - returns zero totals for an empty cart
    ok 2 - charges $10 shipping when subtotal is strictly below $100
    ok 3 - provides FREE shipping when subtotal equals exactly $100.00
    ok 4 - provides FREE shipping when subtotal exceeds $100.00
    ok 5 - eliminates floating-point inaccuracies using integer cents
ok 13 - Pricing & Calculation Rules: calculateTotal()

1..13
# tests 57
# suites 0
# pass 57
# fail 0
# cancelled 0
# skipped 0
# todo 0
```

---

## 💻 How to Run Locally

### Option 1: Using any local static server (Recommended)
Because ShopSphere uses standard ES6 modules (`type="module"`), serve the folder using any HTTP server:

```bash
# Using npx serve
npx serve .

# Or using Python 3
python -m http.server 3000

# Or using Node's http-server
npx http-server -p 8080 -c-1
```
Then open `http://localhost:3000` in your web browser.

### Option 2: Using VS Code Live Server
1. Open the `Task-4-Ecommerce-Store` folder in Visual Studio Code.
2. Right-click `index.html` and select **"Open with Live Server"**.

---

## ☁️ Vercel Deployment Guide

Deploying ShopSphere to **Vercel** requires zero build configuration because it is a clean static web application:

### Method A: Deploy via Vercel CLI
```bash
# 1. Install Vercel CLI (if not already installed)
npm install -g vercel

# 2. Navigate to project directory
cd Task-4-Ecommerce-Store

# 3. Deploy
vercel
```
Follow the interactive CLI prompts:
- *Set up and deploy?* `Y`
- *Which scope do you want to deploy to?* (Select your team or personal account)
- *Link to existing project?* `N`
- *Project name?* `shopsphere-ecommerce-store`
- *In which directory is your code located?* `./`
- Vercel automatically detects static files and produces a live production URL!

### Method B: Deploy via GitHub / GitLab / Bitbucket
1. Initialize a git repository:
   ```bash
   git init
   git add .
   git commit -m "feat: complete ShopSphere e-commerce storefront for Task 4"
   ```
2. Push to your GitHub account repository.
3. Open [vercel.com](https://vercel.com) and click **"Add New Project"**.
4. Import your GitHub repository.
5. In the configuration screen:
   - **Framework Preset:** `Other`
   - **Root Directory:** `./`
   - **Build & Output Settings:** Leave default (No build command needed)
6. Click **Deploy**. Vercel will deploy the site and provide a free `https://*.vercel.app` URL with automated HTTPS and edge CDN caching.

---

## 📋 Evaluation Checklist & Verification

| Requirement | Specification | Status |
| :--- | :--- | :---: |
| **Vanilla Stack** | HTML5, CSS3, Vanilla JS (ES6+), No React / backend | ✅ Complete |
| **API Integration** | `https://fakestoreapi.com/products` with async/await & fetch | ✅ Complete |
| **Skeletons & States** | Loading shimmers, network error retry, empty search states | ✅ Complete |
| **Category Filters** | All, Electronics, Jewelry, Men's Clothing, Women's Clothing | ✅ Complete |
| **Title Search** | Real-time search working alongside category filter & sort | ✅ Complete |
| **Cart Functions** | `addToCart`, `removeFromCart`, `updateQuantity`, `calculateTotal`, `saveCart`, `loadCart` | ✅ Complete |
| **Monetary Precision** | Integer cents engine (`Math.round(price * 100)`) eliminating float drift | ✅ Complete |
| **Pricing Rules** | 8% tax, \$10 shipping under \$100, FREE shipping at \$100+ | ✅ Complete |
| **Cart Persistence** | Synchronized with `localStorage` and corrupt data recovery | ✅ Complete |
| **Cart Drawer** | Slide-out right drawer with overlay, stepper, free shipping tracker | ✅ Complete |
| **Simulated Checkout**| Full modal with form validation, demo notice, receipt, clears cart on confirmation | ✅ Complete |
| **Accessibility** | WCAG 2.1 AA, semantic markup, focus rings, ARIA, Escape key support | ✅ Complete |
| **Testing** | Automated unit tests covering all functions & edge cases (57 passing) | ✅ Complete |
| **Deployment** | Vercel zero-config static deployment ready | ✅ Complete |

---

## 👨‍💻 Author & Attribution

- **Project:** ShopSphere E-Commerce Storefront
- **Internship:** Datheon Full Stack Web Development Internship
- **Task:** Task 4 — E-Commerce Product Catalog and Interactive Shopping Cart

