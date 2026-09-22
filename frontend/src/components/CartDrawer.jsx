import './CartDrawer.css'

/**
 * CartDrawer Component
 * A slide-over panel displaying cart contents, quantity controls, subtotal, and checkout action.
 * 
 * @param {Object} props
 * @param {Array} props.cart - The array of cart items
 * @param {Function} props.onClose - Callback to close the drawer
 * @param {Function} props.onUpdateQuantity - Callback (productId, delta) to adjust item quantity
 * @param {Function} props.onRemoveItem - Callback (productId) to remove item completely
 */
export default function CartDrawer({
  cart,
  onClose,
  onUpdateQuantity,
  onRemoveItem,
  onOpenCheckout,
}) {
  // Calculate subtotal
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Format currency into INR
  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)

  return (
    <div className="cart-overlay" onClick={onClose}>
      {/* Stop click inside drawer from closing the overlay */}
      <div className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-title">
            <span className="cart-title-icon">🛒</span>
            <h2>Your Shopping Cart</h2>
            <span className="cart-header-count">({totalUnits} {totalUnits === 1 ? 'item' : 'items'})</span>
          </div>
          <button className="cart-close-btn" onClick={onClose} title="Close Cart">
            ✕
          </button>
        </div>

        {/* Cart Body */}
        <div className="cart-body">
          {cart.length === 0 ? (
            <div className="cart-empty-state">
              <span className="empty-cart-icon">🛍️</span>
              <h3>Your cart is empty</h3>
              <p>Explore our catalog and add items to your cart!</p>
              <button className="btn-primary" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items-list">
              {cart.map((item) => (
                <div key={item.id} className="cart-item-row">
                  <img
                    src={item.image_url}
                    alt={item.title}
                    className="cart-item-image"
                  />

                  <div className="cart-item-details">
                    <h4 className="cart-item-title">{item.title}</h4>
                    <span className="cart-item-unit-price">
                      {formatINR(item.price)} each
                    </span>

                    {/* Quantity Controls & Remove */}
                    <div className="cart-item-actions">
                      <div className="qty-control-group">
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                          title="Decrease quantity"
                        >
                          −
                        </button>
                        <span className="qty-number">{item.quantity}</span>
                        <button
                          className="qty-btn"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                          title="Increase quantity"
                        >
                          +
                        </button>
                      </div>

                      <button
                        className="remove-item-btn"
                        onClick={() => onRemoveItem(item.id)}
                        title="Remove item from cart"
                      >
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="cart-item-subtotal">
                    {formatINR(item.price * item.quantity)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer with Subtotal & Checkout */}
        {cart.length > 0 && (
          <div className="cart-footer">
            <div className="cart-subtotal-row">
              <span className="subtotal-label">Subtotal:</span>
              <span className="subtotal-amount">{formatINR(subtotal)}</span>
            </div>

            <div className="delivery-perk">
              <span className="check-icon">✓</span>
              <span>Your order qualifies for <strong>FREE Delivery</strong></span>
            </div>

            <button
              className="checkout-btn"
              onClick={onOpenCheckout}
            >
              Proceed to Checkout ({totalUnits} {totalUnits === 1 ? 'item' : 'items'})
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
