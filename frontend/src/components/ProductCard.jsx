import './ProductCard.css'

/**
 * ProductCard Component
 * Displays individual product details: image, category, title, rating, price (₹), and action button.
 * 
 * @param {Object} props
 * @param {Object} props.product - The product object from FastAPI
 * @param {Function} [props.onAddToCart] - Optional callback when 'Add to Cart' is clicked
 */
export default function ProductCard({ product, onAddToCart }) {
  // Format price into Indian Rupees format (e.g. 24,990 -> ₹24,990.00 or ₹24,990)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(product.price)

  return (
    <div className="product-card">
      <div className="product-card-image-container">
        <img 
          src={product.image_url} 
          alt={product.title} 
          className="product-card-image"
          loading="lazy"
        />
        <span className="product-card-category">{product.category}</span>
      </div>

      <div className="product-card-body">
        <h3 className="product-card-title" title={product.title}>
          {product.title}
        </h3>

        <div className="product-card-rating">
          <span className="star-icon">★</span>
          <span className="rating-value">{product.rating}</span>
          <span className="rating-count">({Math.floor(product.rating * 42)})</span>
        </div>

        <div className="product-card-footer">
          <span className="product-card-price">{formattedPrice}</span>
          <button 
            className="add-to-cart-btn"
            onClick={() => onAddToCart && onAddToCart(product)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  )
}
