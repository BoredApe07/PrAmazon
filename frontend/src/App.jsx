import { useState, useEffect } from 'react'
import ProductCard from './components/ProductCard'
import CategoryFilter from './components/CategoryFilter'
import CartDrawer from './components/CartDrawer'
import CheckoutModal from './components/CheckoutModal'
import ProductDetailModal from './components/ProductDetailModal'
import OrdersModal from './components/OrdersModal'
import AuthModal from './components/AuthModal'
import { fetchProducts, fetchCategories, fetchProductById, fetchCurrentUser } from './services/api'
import './App.css'

export default function App() {
  // Storefront products & categories state
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedCategory, setSelectedCategory] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Shopping cart state with localStorage persistence
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('pramazon_cart')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCartOpen, setIsCartOpen] = useState(false)
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [isOrdersOpen, setIsOrdersOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState(null)

  // User Authentication state
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('pramazon_user')
      return savedUser ? JSON.parse(savedUser) : null
    } catch {
      return null
    }
  })
  const [isAuthOpen, setIsAuthOpen] = useState(false)

  // Verify and refresh auth session on startup using saved JWT
  useEffect(() => {
    const token = localStorage.getItem('pramazon_token')
    if (token) {
      fetchCurrentUser(token)
        .then((userData) => {
          setCurrentUser(userData)
          localStorage.setItem('pramazon_user', JSON.stringify(userData))
        })
        .catch(() => {
          // Token expired or invalid: clear session cleanly
          localStorage.removeItem('pramazon_token')
          localStorage.removeItem('pramazon_user')
          setCurrentUser(null)
        })
    }
  }, [])

  const handleLoginSuccess = (user, token) => {
    localStorage.setItem('pramazon_token', token)
    localStorage.setItem('pramazon_user', JSON.stringify(user))
    setCurrentUser(user)
    setIsAuthOpen(false)
  }

  const handleLogout = () => {
    localStorage.removeItem('pramazon_token')
    localStorage.removeItem('pramazon_user')
    setCurrentUser(null)
  }

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('pramazon_cart', JSON.stringify(cart))
    } catch (err) {
      console.error('Failed to save cart to localStorage:', err)
    }
  }, [cart])

  // Fetch unique categories once on startup
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const data = await fetchCategories()
        setCategories(data)
      } catch (err) {
        console.error('Failed to load categories:', err)
      }
    }
    loadCategories()
  }, [])

  // Fetch products whenever selectedCategory OR searchTerm changes
  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProducts(selectedCategory, searchTerm)
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Failed to connect to backend service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [selectedCategory, searchTerm])

  // Handler to add a product to the cart with quantity tracking and stock limits
  const handleAddToCart = (product, quantityToAdd = 1) => {
    // Guard: Do not add if product has 0 stock
    if (product.stock !== undefined && product.stock <= 0) return

    setCart((prevCart) => {
      // 1. Check if the item is already in the cart
      const existingItem = prevCart.find((item) => item.id === product.id)
      const maxStock = product.stock ?? Infinity

      if (existingItem) {
        // 2. If it exists, increase quantity up to maxStock
        const newQty = Math.min(existingItem.quantity + quantityToAdd, maxStock)
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQty }
            : item
        )
      }

      // 3. If brand new, add it capped at available stock
      const initialQty = Math.min(quantityToAdd, maxStock)
      return [...prevCart, { ...product, quantity: initialQty }]
    })
  }

  // Handle 'Buy Now' from product detail: add item to cart, close detail modal, open checkout
  const handleBuyNow = (product, quantity = 1) => {
    handleAddToCart(product, quantity)
    setSelectedProduct(null)
    setIsCheckoutOpen(true)
  }

  // Handle viewing product details when clicking an item from Cart Drawer or Returns & Orders
  const handleViewProduct = async (productId) => {
    try {
      let product = products.find((p) => p.id === productId)
      if (!product) {
        product = await fetchProductById(productId)
      }
      if (product) {
        setIsCartOpen(false)   // Close cart drawer if open
        setIsOrdersOpen(false) // Close orders modal if open
        setSelectedProduct(product)
      }
    } catch (err) {
      console.error('Failed to load product details:', err)
    }
  }

  // Adjust quantity (+1 or -1) from inside the Cart Drawer with stock limits
  const handleUpdateQuantity = (productId, delta) => {
    setCart((prevCart) =>
      prevCart
        .map((item) => {
          if (item.id === productId) {
            // Guard: If increasing and already at max stock, do not increase
            if (delta > 0 && item.stock !== undefined && item.quantity >= item.stock) {
              return item
            }
            const newQty = item.quantity + delta
            return newQty > 0 ? { ...item, quantity: newQty } : null
          }
          return item
        })
        .filter(Boolean)
    )
  }

  // Remove an item completely from the cart
  const handleRemoveItem = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId))
  }

  // Handle successful order placement (clear cart)
  const handleOrderSuccess = () => {
    setCart([])
    try {
      localStorage.removeItem('pramazon_cart')
    } catch (err) {
      console.error('Failed to clear cart:', err)
    }
  }

  // Calculate total units (e.g. 2 headphones + 1 laptop = 3 items)
  const totalItemsCount = cart.reduce((total, item) => total + item.quantity, 0)

  // Calculate cart total price (price * quantity)
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const formattedCartTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(cartTotal)

  return (
    <div className="app-layout">
      {/* Top E-Commerce Header */}
      <header className="navbar">
        <div className="navbar-container">
          <div className="brand">
            <span className="brand-text">Pr</span>
            <span className="brand-accent">Amazon</span>
          </div>

          {/* Central Search Bar */}
          <div className="search-bar-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder="Search products, brands and keywords..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                className="clear-search-btn"
                onClick={() => setSearchTerm('')}
                title="Clear search"
              >
                ✕
              </button>
            )}
          </div>

          <div className="navbar-actions">
            {/* Account / Sign-In Button */}
            {currentUser ? (
              <div className="account-nav-btn user-logged-in" title={`Signed in as ${currentUser.email}`}>
                <span className="account-nav-top">
                  Hello, {currentUser.name ? currentUser.name.split(' ')[0] : 'Shopper'}
                </span>
                <button
                  type="button"
                  className="account-signout-btn"
                  onClick={handleLogout}
                  title="Sign out of your account"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                type="button"
                className="account-nav-btn"
                onClick={() => setIsAuthOpen(true)}
                title="Sign in to your account"
              >
                <span className="account-nav-top">Hello, sign in</span>
                <span className="account-nav-bottom">Account & Lists</span>
              </button>
            )}

            {/* Returns & Orders Button */}
            <button 
              className="orders-nav-btn"
              onClick={() => setIsOrdersOpen(true)}
              title="Track packages and view order history"
            >
              <span className="orders-nav-top">Returns</span>
              <span className="orders-nav-bottom">& Orders</span>
            </button>

            <div className="cart-badge-container">
              <button 
                className="cart-btn" 
                onClick={() => setIsCartOpen(true)}
                title={totalItemsCount > 0 ? `Total: ${formattedCartTotal}` : 'Cart is empty'}
              >
                <span className="cart-icon">🛒</span>
                <span className="cart-label">Cart</span>
                <span className="cart-count">{totalItemsCount}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container">
        {/* Modern E-Commerce Hero Banner */}
        <section className="hero">
          <span className="hero-tag">Special Launch Offers</span>
          <h1 className="hero-title">Experience Tomorrow's Tech & Lifestyle</h1>
          <p className="hero-desc">
            Handpicked premium gadgets, apparel, and reading essentials with authentic Indian pricing and swift dispatch.
          </p>
        </section>

        {/* Storefront Catalog Section */}
        <section className="storefront-section">
          <div className="storefront-header">
            <div>
              <h2 className="storefront-title">Featured Catalog</h2>
              <p className="storefront-subtitle">
                Explore our curated collection of verified products.
              </p>
            </div>
            <span className="product-count-badge">
              {loading ? 'Refreshing...' : `${products.length} Items Available`}
            </span>
          </div>

          {/* Category Filter Pills */}
          <CategoryFilter
            categories={categories}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />

          {/* Loading State */}
          {loading && (
            <div className="products-loading-state">
              <div className="spinner"></div>
              <p>Loading products from backend...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="products-error-state">
              <div className="products-error-title">⚠️ Unable to Load Products</div>
              <p>{error}</p>
              <button className="btn-primary" onClick={loadProducts}>
                Try Again
              </button>
            </div>
          )}

          {/* Product Grid */}
          {!loading && !error && (
            <div className="products-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={handleAddToCart}
                  onViewDetails={setSelectedProduct}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      {/* Clean Footer */}
      <footer className="footer">
        <p className="footer-text">
          PrAmazon &copy; 2026 &bull; Powered by FastAPI, SQLAlchemy & React
        </p>
      </footer>

      {/* Slide-Over Cart Drawer */}
      {isCartOpen && (
        <CartDrawer
          cart={cart}
          onClose={() => setIsCartOpen(false)}
          onUpdateQuantity={handleUpdateQuantity}
          onRemoveItem={handleRemoveItem}
          onOpenCheckout={() => {
            setIsCartOpen(false)
            setIsCheckoutOpen(true)
          }}
          onViewProduct={handleViewProduct}
        />
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <CheckoutModal
          cart={cart}
          onClose={() => setIsCheckoutOpen(false)}
          onOrderSuccess={handleOrderSuccess}
          currentUser={currentUser}
        />
      )}

      {/* Product Detail "Quick View" Modal */}
      {selectedProduct && (
        <ProductDetailModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
          onAddToCart={handleAddToCart}
          onBuyNow={handleBuyNow}
        />
      )}

      {/* Returns & Orders Modal */}
      {isOrdersOpen && (
        <OrdersModal 
          onClose={() => setIsOrdersOpen(false)} 
          onViewProduct={handleViewProduct}
          currentUser={currentUser}
        />
      )}

      {/* Authentication Modal (Sign In / Register) */}
      {isAuthOpen && (
        <AuthModal
          onClose={() => setIsAuthOpen(false)}
          onLoginSuccess={handleLoginSuccess}
        />
      )}
    </div>
  )
}
