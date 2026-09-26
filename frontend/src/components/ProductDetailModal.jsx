import { useState, useEffect } from 'react'
import './ProductDetailModal.css'

/**
 * ProductDetailModal Component
 * Displays comprehensive product information, high-res image, stock availability,
 * customer ratings, detailed description, and quantity selector for adding to cart.
 * 
 * @param {Object} props
 * @param {Object} props.product - The product object to display
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onAddToCart - Callback to add product with specific quantity
 * @param {Function} props.onBuyNow - Callback to add and immediately open checkout
 */
export default function ProductDetailModal({ product, onClose, onAddToCart, onBuyNow }) {
  // Local state for quantity selector (minimum 1, maximum available stock)
  const [quantity, setQuantity] = useState(1)
  const [addedNotice, setAddedNotice] = useState(false)

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  if (!product) return null

  // Format price into Indian Rupees format (₹)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(product.price)

  const isOutOfStock = product.stock <= 0
  const isLowStock = product.stock > 0 && product.stock <= 5

  // Quantity handlers
  const handleIncrease = () => {
    if (quantity < product.stock) {
      setQuantity((prev) => prev + 1)
    }
  }

  const handleDecrease = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1)
    }
  }

  // Handle Add to Cart with temporary visual feedback
  const handleAdd = () => {
    if (onAddToCart) {
      onAddToCart(product, quantity)
      setAddedNotice(true)
      setTimeout(() => setAddedNotice(false), 2000)
    }
  }

  // Handle Buy Now (add to cart + trigger checkout)
  const handleInstantBuy = () => {
    if (onBuyNow) {
      onBuyNow(product, quantity)
    }
  }

  return (
    <div className="product-modal-overlay" onClick={onClose}>
      <div
        className="product-modal-container"
        onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
      >
        {/* Close Button */}
        <button
          className="product-modal-close"
          onClick={onClose}
          aria-label="Close modal"
        >
          ✕
        </button>

        <div className="product-modal-grid">
          {/* Left Column: Image Section */}
          <div className="product-modal-image-col">
            <div className="product-modal-image-box">
              <img
                src={product.image_url}
                alt={product.title}
                className="product-modal-img"
              />
              <span className="product-modal-category-tag">
                {product.category}
              </span>
            </div>
          </div>

          {/* Right Column: Product Details & Actions */}
          <div className="product-modal-info-col">
            {/* Title */}
            <h2 className="product-modal-title">{product.title}</h2>

            {/* Rating */}
            <div className="product-modal-rating-row">
              <div className="product-modal-stars">
                {'★'.repeat(Math.round(product.rating))}
                {'☆'.repeat(5 - Math.round(product.rating))}
              </div>
              <span className="product-modal-rating-num">{product.rating}</span>
              <span className="product-modal-rating-count">
                ({product.rating_count ? product.rating_count.toLocaleString('en-IN') : '0'} ratings)
              </span>
            </div>

            {/* Price */}
            <div className="product-modal-price-box">
              <span className="product-modal-price">{formattedPrice}</span>
              <span className="product-modal-tax-note">Inclusive of all taxes</span>
            </div>

            {/* Stock Availability Badge */}
            <div className="product-modal-stock-status">
              {isOutOfStock ? (
                <span className="stock-badge out-of-stock">
                  ✕ Currently Unavailable
                </span>
              ) : isLowStock ? (
                <span className="stock-badge low-stock">
                  ⚠ Only {product.stock} left in stock — order soon!
                </span>
              ) : (
                <span className="stock-badge in-stock">
                  ✓ In Stock ({product.stock} units available)
                </span>
              )}
            </div>

            {/* Description */}
            <div className="product-modal-desc-box">
              <h4 className="product-modal-desc-title">About this item</h4>
              <p className="product-modal-description">
                {product.description || 'No detailed description available for this product.'}
              </p>
            </div>

            {/* E-commerce Assurances */}
            <div className="product-modal-perks">
              <div className="perk-item">
                <span className="perk-icon">🚚</span>
                <span className="perk-text">Fast & Free Delivery</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">💵</span>
                <span className="perk-text">Cash on Delivery</span>
              </div>
              <div className="perk-item">
                <span className="perk-icon">🔄</span>
                <span className="perk-text">7-Day Replacement</span>
              </div>
            </div>

            {/* Purchase Controls */}
            {!isOutOfStock && (
              <div className="product-modal-purchase-section">
                {/* Quantity Selector */}
                <div className="modal-quantity-row">
                  <span className="modal-quantity-label">Quantity:</span>
                  <div className="modal-quantity-stepper">
                    <button
                      type="button"
                      className="modal-qty-btn"
                      onClick={handleDecrease}
                      disabled={quantity <= 1}
                    >
                      −
                    </button>
                    <span className="modal-qty-display">{quantity}</span>
                    <button
                      type="button"
                      className="modal-qty-btn"
                      onClick={handleIncrease}
                      disabled={quantity >= product.stock}
                    >
                      +
                    </button>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="modal-actions-row">
                  <button
                    type="button"
                    className="modal-add-cart-btn"
                    onClick={handleAdd}
                  >
                    Add to Cart
                  </button>
                  <button
                    type="button"
                    className="modal-buy-now-btn"
                    onClick={handleInstantBuy}
                  >
                    Buy Now
                  </button>
                </div>

                {/* Temporary confirmation banner */}
                {addedNotice && (
                  <div className="modal-added-banner">
                    ✓ Added {quantity} {quantity > 1 ? 'items' : 'item'} to your cart!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
