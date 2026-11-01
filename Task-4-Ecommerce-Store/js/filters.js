/**
 * Filter, Search, and Sorting Engine for ShopSphere
 * Datheon Full Stack Web Development Internship Task 4
 */

/**
 * Normalizes category names for matching FakeStoreAPI category strings
 * FakeStoreAPI categories:
 * - "electronics"
 * - "jewelery"
 * - "men's clothing"
 * - "women's clothing"
 */
export function normalizeCategory(category = '') {
  const lower = String(category).trim().toLowerCase();
  if (lower === 'all' || lower === 'all products' || lower === '') {
    return 'all';
  }
  // Standardize American spelling "jewelry" to API's "jewelery"
  if (lower === 'jewelry') {
    return 'jewelery';
  }
  return lower;
}

/**
 * Checks if a product matches the selected category filter
 */
export function matchesCategory(product, selectedCategory = 'all') {
  const targetCategory = normalizeCategory(selectedCategory);
  if (targetCategory === 'all') return true;

  if (!product || !product.category) return false;
  const productCategory = normalizeCategory(product.category);

  return productCategory === targetCategory;
}

/**
 * Checks if a product matches the search query (by product title)
 */
export function matchesSearch(product, searchQuery = '') {
  const query = String(searchQuery).trim().toLowerCase();
  if (!query) return true;

  if (!product || !product.title) return false;
  const title = String(product.title).toLowerCase();

  return title.includes(query);
}

/**
 * Sorts an array of products based on selected criteria
 */
export function sortProducts(products = [], sortBy = 'featured') {
  const list = [...products];

  switch (sortBy) {
    case 'price-low':
    case 'price-asc':
      return list.sort((a, b) => a.price - b.price);

    case 'price-high':
    case 'price-desc':
      return list.sort((a, b) => b.price - a.price);

    case 'rating-desc':
    case 'rating':
      return list.sort((a, b) => {
        const rateA = a.rating ? a.rating.rate : 0;
        const rateB = b.rating ? b.rating.rate : 0;
        return rateB - rateA;
      });

    case 'title-asc':
    case 'alphabetical':
      return list.sort((a, b) => a.title.localeCompare(b.title));

    case 'featured':
    default:
      return list;
  }
}

/**
 * Combined filter and search function that runs category filter,
 * title search, and sorting simultaneously.
 */
export function filterProducts(products = [], { category = 'all', search = '', sortBy = 'featured' } = {}) {
  if (!Array.isArray(products)) return [];

  const filtered = products.filter(product => {
    return matchesCategory(product, category) && matchesSearch(product, search);
  });

  return sortProducts(filtered, sortBy);
}

