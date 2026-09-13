import { useState, useEffect } from 'react'
import ProductCard from './components/ProductCard'
import { fetchProducts } from './services/api'
import './App.css'

export default function App() {
  // Storefront products state
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Shopping cart state (lifted up to App level)
  const [cart, setCart] = useState([])

  // Load products from FastAPI backend
  const loadProducts = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchProducts()
      setProducts(data)
    } catch (err) {
      setError(err.message || 'Failed to connect to backend service')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProducts()
  }, [])

  // Handler to add a product to the cart
  const handleAddToCart = (product) => {
    setCart((prevCart) => [...prevCart, product])
  }

  // Calculate cart total price
  const cartTotal = cart.reduce((sum, item) => sum + item.price, 0)
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

          <div className="navbar-actions">
            <div className="cart-badge-container">
              <button 
                className="cart-btn" 
                title={cart.length > 0 ? `Total: ${formattedCartTotal}` : 'Cart is empty'}
              >
                <span className="cart-icon">🛒</span>
                <span className="cart-label">Cart</span>
                <span className="cart-count">{cart.length}</span>
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
    </div>
  )
}
