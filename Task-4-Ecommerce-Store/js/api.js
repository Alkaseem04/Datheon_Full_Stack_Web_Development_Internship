/**
 * API Client & Validation Service for ShopSphere
 * Datheon Full Stack Web Development Internship Task 4
 * 
 * Fetches and strictly validates data from FakeStoreAPI
 */

export const FAKESTORE_API_URL = 'https://fakestoreapi.com/products';

/**
 * Validates a single product object from the API
 * Ensures id, title, price, category, image, and rating are properly typed and present.
 */
export function validateProduct(item) {
  if (!item || typeof item !== 'object') {
    return { valid: false, error: 'Product must be a non-null object' };
  }

  if (typeof item.id !== 'number' && typeof item.id !== 'string') {
    return { valid: false, error: 'Product id is required and must be a number or string' };
  }

  if (!item.title || typeof item.title !== 'string' || item.title.trim() === '') {
    return { valid: false, error: 'Product title must be a non-empty string' };
  }

  if (typeof item.price !== 'number' || isNaN(item.price) || item.price < 0 || !isFinite(item.price)) {
    return { valid: false, error: 'Product price must be a valid non-negative number' };
  }

  if (!item.category || typeof item.category !== 'string') {
    return { valid: false, error: 'Product category must be a valid string' };
  }

  if (!item.image || typeof item.image !== 'string') {
    return { valid: false, error: 'Product image must be a string URL' };
  }

  // Rating is optional in some APIs, but if present should be validated or normalized
  const ratingRate = item.rating && typeof item.rating.rate === 'number' && !isNaN(item.rating.rate) 
    ? item.rating.rate 
    : 0;
  const ratingCount = item.rating && typeof item.rating.count === 'number' && !isNaN(item.rating.count) 
    ? item.rating.count 
    : 0;

  return {
    valid: true,
    product: {
      id: item.id,
      title: item.title.trim(),
      price: Number(item.price),
      description: typeof item.description === 'string' ? item.description.trim() : '',
      category: item.category.trim(),
      image: item.image.trim(),
      rating: {
        rate: Math.min(5, Math.max(0, ratingRate)),
        count: Math.max(0, Math.floor(ratingCount))
      }
    }
  };
}

/**
 * Validates an array of products
 */
export function validateProducts(data) {
  if (!Array.isArray(data)) {
    throw new Error('API response validation failed: expected an array of products');
  }

  if (data.length === 0) {
    return [];
  }

  const validProducts = [];
  const validationErrors = [];

  for (let i = 0; i < data.length; i++) {
    const result = validateProduct(data[i]);
    if (result.valid) {
      validProducts.push(result.product);
    } else {
      validationErrors.push(`Index ${i}: ${result.error}`);
    }
  }

  if (validProducts.length === 0 && data.length > 0) {
    throw new Error(`All received items failed validation: ${validationErrors.join('; ')}`);
  }

  return validProducts;
}

/**
 * Fetches products from FakeStoreAPI with network timeout and strict validation
 */
export async function fetchProducts(apiUrl = FAKESTORE_API_URL, options = {}) {
  const { timeout = 12000, fetchFn = (typeof fetch !== 'undefined' ? fetch : null) } = options;

  if (!fetchFn) {
    throw new Error('fetch is not defined in this environment');
  }

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timeoutId = controller ? setTimeout(() => controller.abort(), timeout) : null;

  try {
    const fetchOptions = controller ? { signal: controller.signal } : {};
    const response = await fetchFn(apiUrl, fetchOptions);

    if (!response.ok) {
      throw new Error(`Server returned HTTP ${response.status} (${response.statusText || 'Error'})`);
    }

    const json = await response.json();
    const validated = validateProducts(json);
    return validated;
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error(`Request timed out after ${timeout / 1000} seconds. Please check your internet connection.`);
    }
    // Network or parse error
    throw error;
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

