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

/**
 * Place a new order with customer checkout details and items.
 * 
 * @param {Object} orderData
 * @param {string} orderData.customer_name
 * @param {string} orderData.customer_email
 * @param {string} orderData.shipping_address
 * @param {Array<{ product_id: number, quantity: number }>} orderData.items
 */
export const createOrder = async (orderData) => {
  const response = await fetch(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    // Extract FastAPI detailed error message if available (e.g. "Insufficient stock")
    const errorData = await response.json().catch(() => null)
    const message = errorData?.detail || `Order failed: ${response.status} ${response.statusText}`
    throw new Error(message)
  }

  return await response.json()
}

