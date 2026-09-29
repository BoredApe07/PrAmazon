/**
 * Central API Service Layer for PrAmazon
 * Handles all HTTP communication with the FastAPI backend.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api/v1'

/**
 * Safely extracts a user-readable error message from backend responses.
 * Handles both plain strings (400, 401, 403, 404) and Pydantic validation lists (422).
 */
const extractErrorMessage = (errorData, defaultMessage) => {
  if (!errorData) return defaultMessage

  // Case 1: FastAPI returned a simple string message
  if (typeof errorData.detail === 'string') {
    return errorData.detail
  }

  // Case 2: FastAPI / Pydantic returned a list of validation errors (422)
  if (Array.isArray(errorData.detail)) {
    return errorData.detail
      .map((item) => item.msg || 'Invalid input')
      .join(', ')
  }

  // Case 3: detail is an object with a msg property
  if (errorData.detail && typeof errorData.detail === 'object') {
    return errorData.detail.msg || defaultMessage
  }

  return defaultMessage
}

/**
 * Fetch paginated products from FastAPI with optional category, search, and page parameters.
 */
export const fetchProducts = async (category = '', search = '', page = 1, limit = 12, inStockOnly = false) => {
  const params = new URLSearchParams()
  if (category) params.append('category', category)
  if (search) params.append('search', search)
  if (page) params.append('page', page)
  if (limit) params.append('limit', limit)
  if (inStockOnly) params.append('in_stock', 'true')

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE_URL}/products/${queryString}`)

  if (!response.ok) {
    throw new Error(`Failed to fetch products: ${response.status} ${response.statusText}`)
  }

  return await response.json()
}

/**
 * Fetch a single product by its unique database ID.
 */
export const fetchProductById = async (productId) => {
  const response = await fetch(`${API_BASE_URL}/products/${productId}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch product: ${response.status}`)
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
 * Create a new product in the store catalog (Administrator only).
 * 
 * @param {Object} productData
 * @param {string} productData.title
 * @param {number} productData.price
 * @param {string} productData.category
 * @param {number} productData.stock
 * @param {string} [productData.description]
 * @param {string} [productData.image_url]
 * @param {string} [token] - Optional JWT token. If omitted, reads from localStorage.
 */
export const createProduct = async (productData, token = null) => {
  const authToken = token || localStorage.getItem('pramazon_token')
  if (!authToken) {
    throw new Error('Please sign in as an Administrator to add products.')
  }

  const response = await fetch(`${API_BASE_URL}/products/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify(productData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Failed to create product: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Place a new order with customer shipping address and items.
 * 
 * @param {Object} orderData
 * @param {string} orderData.shipping_address
 * @param {Array<{ product_id: number, quantity: number }>} orderData.items
 * @param {string} [token] - Optional JWT token. If omitted, reads from localStorage.
 */
export const createOrder = async (orderData, token = null, idempotencyKey = null) => {
  const authToken = token || localStorage.getItem('pramazon_token')
  if (!authToken) {
    throw new Error('Please sign in to place an order.')
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${authToken}`,
  }

  if (idempotencyKey) {
    headers['Idempotency-Key'] = idempotencyKey
  }

  const response = await fetch(`${API_BASE_URL}/orders/`, {
    method: 'POST',
    headers,
    body: JSON.stringify(orderData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Order failed: ${response.status} ${response.statusText}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Fetch paginated orders for the currently authenticated user.
 * 
 * @param {number} [page=1] - Page number (1-indexed)
 * @param {number} [limit=10] - Items per page
 * @param {string} [status=''] - Optional status filter
 * @param {string} [token=null] - Optional JWT token. If omitted, reads from localStorage.
 */
export const fetchOrders = async (page = 1, limit = 10, status = '', token = null) => {
  const authToken = token || localStorage.getItem('pramazon_token')
  if (!authToken) {
    throw new Error('Please sign in to view your orders.')
  }

  const params = new URLSearchParams()
  if (page) params.append('page', page)
  if (limit) params.append('limit', limit)
  if (status) params.append('status', status)

  const queryString = params.toString() ? `?${params.toString()}` : ''
  const response = await fetch(`${API_BASE_URL}/orders/${queryString}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Failed to fetch orders: ${response.status} ${response.statusText}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Fetch a single order by its ID for live tracking/receipt lookup.
 * 
 * @param {number} orderId
 * @param {string} [token] - Optional JWT token. If omitted, reads from localStorage.
 */
export const fetchOrderById = async (orderId, token = null) => {
  const authToken = token || localStorage.getItem('pramazon_token')
  if (!authToken) {
    throw new Error('Please sign in to view this order.')
  }

  const response = await fetch(`${API_BASE_URL}/orders/${orderId}`, {
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error(`Order #${orderId} was not found. Please verify the Order ID.`)
    }
    if (response.status === 403) {
      throw new Error(`You are not authorized to view Order #${orderId}.`)
    }
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Failed to fetch order: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Cancel an order by its ID and restore inventory stock.
 * 
 * @param {number} orderId
 * @param {string} [token] - Optional JWT token. If omitted, reads from localStorage.
 */
export const cancelOrder = async (orderId, token = null) => {
  const authToken = token || localStorage.getItem('pramazon_token')
  if (!authToken) {
    throw new Error('Please sign in to cancel this order.')
  }

  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${authToken}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Failed to cancel order: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Update the delivery and fulfillment status of an order (Administrator only).
 * 
 * @param {number} orderId
 * @param {string} status - 'confirmed', 'shipped', 'out_for_delivery', 'delivered'
 * @param {string} [token] - Optional JWT token
 */
export const updateOrderStatus = async (orderId, status, token = null) => {
  const authToken = token || localStorage.getItem('pramazon_token')
  if (!authToken) {
    throw new Error('Please sign in as an Administrator to update order status.')
  }

  const response = await fetch(`${API_BASE_URL}/orders/${orderId}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
    },
    body: JSON.stringify({ status }),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Failed to update status: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Register a new customer account.
 * 
 * @param {Object} userData
 * @param {string} userData.name
 * @param {string} userData.email
 * @param {string} userData.password
 */
export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(userData),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Registration failed: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Authenticate customer credentials and retrieve JWT token.
 * 
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 */
export const loginUser = async (credentials) => {
  const response = await fetch(`${API_BASE_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Login failed: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

/**
 * Fetch the currently logged-in user's profile using their saved JWT token.
 * 
 * @param {string} token - The Bearer JWT access token
 */
export const fetchCurrentUser = async (token) => {
  const response = await fetch(`${API_BASE_URL}/auth/me`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  })

  if (!response.ok) {
    const errorData = await response.json().catch(() => null)
    const message = extractErrorMessage(errorData, `Authentication expired or invalid: ${response.status}`)
    throw new Error(message)
  }

  return await response.json()
}

