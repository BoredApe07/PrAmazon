import './ProductCard.css'

/**
 * ProductCard Component
 * Displays product image with rating badge on top of image (bottom-left),
 * title, and price in integer rupees.
 * No Add to Cart button or top category tag (opens modal on click).
 */
export default function ProductCard({ product, onViewDetails }) {
  // Format price into Indian Rupees format without paise (e.g. ₹24,990)
  const formattedPrice = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(Math.round(product.price))

  // Compact rating count (e.g. 14,820 -> 14.8k, or 211)
  const formattedCount = product.rating_count
    ? product.rating_count >= 1000
      ? `${(product.rating_count / 1000).toFixed(1).replace(/\.0$/, '')}k`
      : product.rating_count
    : '0'

  return (
    <div 
      className={`product-card ${product.stock <= 0 ? 'is-out-of-stock' : ''}`}
      onClick={() => onViewDetails && onViewDetails(product)}
      role="button"
      tabIndex={0}
      title={`View details for ${product.title}`}
    >
      <div className="product-card-image-container">
        <img 
          src={product.image_url} 
          alt={product.title} 
          className="product-card-image"
          loading="lazy"
        />

        {/* Rating Badge on top of image (Bottom-Left) */}
        <div className="product-card-rating-badge">
          <span className="rating-score">{product.rating}</span>
          <span className="rating-star">★</span>
          <span className="rating-divider">|</span>
          <span className="rating-count">{formattedCount}</span>
        </div>

        {/* Out of Stock Badge on Image (Top-Right) */}
        {product.stock <= 0 && (
          <span className="product-card-stock-badge">Out of Stock</span>
        )}
      </div>

      <div className="product-card-body">
        <h3 className="product-card-title" title={product.title}>
          {product.title}
        </h3>

        <div className="product-card-footer">
          <span className="product-card-price">{formattedPrice}</span>
        </div>
      </div>
    </div>
  )
}
