import { useState } from 'react'
import { createOrder } from '../services/api'
import './CheckoutModal.css'

/**
 * CheckoutModal Component
 * Handles customer checkout: collects shipping information, submits the order
 * to the FastAPI backend, and displays the confirmed receipt.
 * 
 * @param {Object} props
 * @param {Array} props.cart - Current items in the cart
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onOrderSuccess - Callback when order is placed successfully
 */
export default function CheckoutModal({ cart, onClose, onOrderSuccess }) {
  // Form fields state
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    shipping_address: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const [receipt, setReceipt] = useState(null)

  // Calculations
  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const totalUnits = cart.reduce((sum, item) => sum + item.quantity, 0)

  // INR currency formatter
  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)

  // Update form fields dynamically
  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  // Submit order to FastAPI backend
  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      // 1. Prepare items payload (backend requires product_id and quantity)
      const orderPayload = {
        customer_name: formData.customer_name.trim(),
        customer_email: formData.customer_email.trim(),
        shipping_address: formData.shipping_address.trim(),
        items: cart.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      }

      // 2. Call backend API
      const createdOrder = await createOrder(orderPayload)

      // 3. Save receipt and notify parent
      setReceipt(createdOrder)
      if (onOrderSuccess) {
        onOrderSuccess(createdOrder)
      }
    } catch (err) {
      setError(err.message || 'Failed to place order. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="checkout-overlay" onClick={onClose}>
      <div className="checkout-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="checkout-header">
          <div className="checkout-header-title">
            <span className="checkout-icon">📦</span>
            <h2>{receipt ? 'Order Confirmed!' : 'Express Checkout'}</h2>
          </div>
          <button className="checkout-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Modal Body: Either Receipt Screen OR Checkout Form */}
        <div className="checkout-body">
          {receipt ? (
            /* Screen 2: Order Receipt Screen */
            <div className="receipt-screen">
              <div className="success-badge-icon">✓</div>
              <h3 className="success-title">Thank you for your order!</h3>
              <p className="success-desc">
                Your order has been placed and is being prepared for dispatch.
              </p>

              <div className="receipt-box">
                <div className="receipt-row">
                  <span className="receipt-label">Order ID:</span>
                  <span className="receipt-val order-id-highlight">#{receipt.id}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Customer:</span>
                  <span className="receipt-val">{receipt.customer_name}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Email:</span>
                  <span className="receipt-val">{receipt.customer_email}</span>
                </div>
                <div className="receipt-row">
                  <span className="receipt-label">Deliver To:</span>
                  <span className="receipt-val">{receipt.shipping_address}</span>
                </div>
                <div className="receipt-row receipt-total-row">
                  <span className="receipt-label">Total Amount:</span>
                  <span className="receipt-val receipt-total-amount">
                    {formatINR(receipt.total_amount)}
                  </span>
                </div>
              </div>

              <div className="receipt-perk">
                <span>🚚 Estimated Delivery: <strong>2 - 3 Business Days</strong></span>
              </div>

              <button className="btn-primary continue-shopping-btn" onClick={onClose}>
                Continue Shopping
              </button>
            </div>
          ) : (
            /* Screen 1: Checkout Form */
            <form onSubmit={handleSubmit} className="checkout-form">
              {/* Order Summary Box */}
              <div className="order-mini-summary">
                <div className="summary-left">
                  <span className="summary-label">Ordering:</span>
                  <span className="summary-items-count">
                    {totalUnits} {totalUnits === 1 ? 'item' : 'items'}
                  </span>
                </div>
                <div className="summary-right">
                  <span className="summary-label">Total:</span>
                  <span className="summary-price">{formatINR(totalAmount)}</span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="checkout-error-alert">
                  <span className="alert-icon">⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {/* Customer Full Name */}
              <div className="form-group">
                <label htmlFor="customer_name">Full Name *</label>
                <input
                  id="customer_name"
                  type="text"
                  name="customer_name"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={formData.customer_name}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              {/* Customer Email */}
              <div className="form-group">
                <label htmlFor="customer_email">Email Address *</label>
                <input
                  id="customer_email"
                  type="email"
                  name="customer_email"
                  required
                  placeholder="e.g. rahul@example.com"
                  value={formData.customer_email}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              {/* Shipping Address */}
              <div className="form-group">
                <label htmlFor="shipping_address">Delivery Address *</label>
                <textarea
                  id="shipping_address"
                  name="shipping_address"
                  required
                  rows="3"
                  placeholder="House/Flat number, Street name, City, Pincode"
                  value={formData.shipping_address}
                  onChange={handleChange}
                  disabled={submitting}
                />
              </div>

              {/* Payment Method Badge */}
              <div className="payment-method-box">
                <div className="payment-radio">
                  <span className="payment-radio-dot">●</span>
                  <span className="payment-title">Cash on Delivery / UPI on Delivery</span>
                </div>
                <span className="payment-badge">No Advance Payment Needed</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="checkout-submit-btn"
                disabled={submitting || cart.length === 0}
              >
                {submitting ? 'Placing Order...' : `Place Order • ${formatINR(totalAmount)}`}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
