/**
 * Central API Service Layer for PrAmazon
 * Handles all HTTP communication with the FastAPI backend.
 */

const API_BASE_URL = 'http://127.0.0.1:8000/api/v1'

/**
 * Fetch products from FastAPI with optional category and search filters.
 */
export const fetchProducts = async (category = '', search = '') => {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (search) params.append('search', search)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE_URL}/products/${queryString}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Fetch unique product categories from FastAPI.
 */
export const fetchCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/products/categories`)
  if (!response.ok) {
    throw new Error(`Failed to fetch categories: ${response.status}`)
  }
  return await response.json()
}
