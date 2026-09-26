import { useState, useEffect } from 'react'
import { fetchOrders, cancelOrder } from '../services/api'
import './OrdersModal.css'

/**
 * OrdersModal Component
 * Displays past placed orders, live order tracking by ID, and delivery status.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function OrdersModal({ onClose, onViewProduct }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Live search filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelNotice, setCancelNotice] = useState(null)

  // Handle cancel order with confirmation
  const handleCancelOrder = async (orderId) => {
    if (!window.confirm(`Are you sure you want to cancel Order #${orderId}? Stock will be released back to inventory.`)) {
      return
    }

    setCancellingId(orderId)
    try {
      const updatedOrder = await cancelOrder(orderId)
      // Update local orders state with the updated cancelled order
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      )
      setCancelNotice(`Order #${orderId} was cancelled successfully. Stock has been restored.`)
      setTimeout(() => setCancelNotice(null), 4000)
    } catch (err) {
      alert(err.message || 'Failed to cancel order')
    } finally {
      setCancellingId(null)
    }
  }

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  // Load all recent orders on mount
  useEffect(() => {
    loadOrders()
  }, [])

  const loadOrders = async () => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOrders()
      setOrders(data)
    } catch (err) {
      setError(err.message || 'Unable to load orders')
    } finally {
      setLoading(false)
    }
  }

  // Format currency in Indian Rupees
  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2,
    }).format(amount)

  // Format date readable
  const formatDate = (isoString) => {
    if (!isoString) return 'Recent'
    const date = new Date(isoString)
    return date.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  // DERIVED STATE: Filter orders instantaneously in 0ms without extra network calls!
  const cleanSearch = searchTerm.trim().toLowerCase().replace('#', '')
  const filteredOrders = cleanSearch
    ? orders.filter((order) => {
        const matchesId = order.id.toString() === cleanSearch
        const matchesEmail = (order.customer_email || '').toLowerCase().includes(cleanSearch)
        const matchesName = (order.customer_name || '').toLowerCase().includes(cleanSearch)
        const matchesItem = order.items && order.items.some((item) =>
          (item.product_title || '').toLowerCase().includes(cleanSearch)
        )
        return matchesId || matchesEmail || matchesName || matchesItem
      })
    : orders

  return (
    <div className="orders-modal-overlay" onClick={onClose}>
      <div
        className="orders-modal-container"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking modal body
      >
        {/* Modal Header */}
        <div className="orders-modal-header">
          <div>
            <h2 className="orders-modal-title">Returns & Orders</h2>
            <p className="orders-modal-subtitle">
              Track packages, inspect receipts, and manage your recent purchases
            </p>
          </div>
          <button
            className="orders-modal-close"
            onClick={onClose}
            aria-label="Close orders modal"
          >
            ✕
          </button>
        </div>

        {/* Live Search Bar */}
        <div className="orders-lookup-bar">
          <div className="orders-lookup-form">
            <span className="lookup-icon">🔍</span>
            <input
              type="text"
              className="orders-lookup-input"
              placeholder="Search by Order ID (e.g. 1), email, or product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                className="orders-lookup-clear"
                onClick={() => setSearchTerm('')}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Modal Body */}
        <div className="orders-modal-body">
          {/* Cancellation Notice Banner */}
          {cancelNotice && (
            <div className="orders-cancel-banner">
              ✓ {cancelNotice}
            </div>
          )}
          {/* Loading State */}
          {loading && (
            <div className="orders-loading-state">
              <div className="orders-spinner"></div>
              <p>Fetching your order history...</p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="orders-error-state">
              <p>⚠️ {error}</p>
              <button className="orders-retry-btn" onClick={loadOrders}>
                Retry
              </button>
            </div>
          )}

          {/* Empty State: No Orders at all in DB */}
          {!loading && !error && orders.length === 0 && (
            <div className="orders-empty-state">
              <span className="empty-box-icon">📦</span>
              <h3>No Orders Placed Yet</h3>
              <p>You haven't placed any orders yet. Browse our catalog and checkout with Cash on Delivery!</p>
              <button className="orders-start-shopping-btn" onClick={onClose}>
                Start Shopping
              </button>
            </div>
          )}

          {/* Empty State: Search Query didn't match anything */}
          {!loading && !error && orders.length > 0 && filteredOrders.length === 0 && (
            <div className="orders-empty-state">
              <span className="empty-box-icon">🔎</span>
              <h3>No matching orders found</h3>
              <p>We couldn't find any orders matching "{searchTerm}".</p>
              <button 
                className="orders-start-shopping-btn"
                onClick={() => setSearchTerm('')}
              >
                Show All Orders
              </button>
            </div>
          )}

          {/* Filtered Orders List */}
          {!loading && !error && filteredOrders.length > 0 && (
            <div className="orders-list">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 className="section-title" style={{ margin: 0 }}>
                  {searchTerm.trim()
                    ? `Search Results (${filteredOrders.length})`
                    : `All Orders (${orders.length})`}
                </h3>
                {searchTerm.trim() && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#0284c7',
                      fontWeight: 600,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                    }}
                  >
                    ← View All ({orders.length})
                  </button>
                )}
              </div>

              {filteredOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  formatINR={formatINR} 
                  formatDate={formatDate} 
                  onCancelOrder={handleCancelOrder}
                  cancellingId={cancellingId}
                  onViewProduct={onViewProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Subcomponent to render a single Amazon-style order card
 */
function OrderCard({ order, formatINR, formatDate, onCancelOrder, cancellingId, onViewProduct }) {
  const isCancelled = order.status === 'cancelled'

  return (
    <div className="order-card">
      {/* Top Banner (Amazon Gray Header) */}
      <div className="order-card-header">
        <div className="order-meta-col">
          <span className="meta-label">ORDER PLACED</span>
          <span className="meta-value">{formatDate(order.created_at)}</span>
        </div>
        <div className="order-meta-col">
          <span className="meta-label">TOTAL</span>
          <span className="meta-value highlight">{formatINR(order.total_amount)}</span>
        </div>
        <div className="order-meta-col">
          <span className="meta-label">SHIP TO</span>
          <span className="meta-value" title={order.shipping_address}>
            {order.customer_name}
          </span>
        </div>
        <div className="order-meta-col order-id-col">
          <span className="meta-label">ORDER #</span>
          <span className="meta-value order-id-badge">#{order.id}</span>
        </div>
      </div>

      {/* Card Content */}
      <div className="order-card-content">
        <div className="order-status-row">
          {isCancelled ? (
            <div className="status-badge-group cancelled">
              <span className="status-dot red">●</span>
              <span className="status-text">Cancelled — Refund not applicable (Cash on Delivery)</span>
            </div>
          ) : (
            <div className="status-badge-group confirmed">
              <span className="status-dot">●</span>
              <span className="status-text">Confirmed — Preparing for Dispatch</span>
            </div>
          )}

          <div className="order-actions-group">
            <span className="payment-tag">Cash on Delivery</span>
            {!isCancelled && onCancelOrder && (
              <button
                type="button"
                className="cancel-order-btn"
                onClick={() => onCancelOrder(order.id)}
                disabled={cancellingId === order.id}
                title="Cancel this order and release stock"
              >
                {cancellingId === order.id ? 'Cancelling...' : 'Cancel Order'}
              </button>
            )}
          </div>
        </div>

        <p className="order-shipping-summary">
          <strong>Delivery Address:</strong> {order.shipping_address}
        </p>

        {/* Purchased Items List */}
        <div className="order-items-container">
          {order.items.map((item) => (
            <div 
              key={item.id} 
              className={`order-item-row ${onViewProduct ? 'clickable' : ''}`}
              onClick={() => onViewProduct && onViewProduct(item.product_id)}
              title="Click to view product details"
            >
              {item.product_image_url ? (
                <img
                  src={item.product_image_url}
                  alt={item.product_title || 'Product'}
                  className="order-item-thumb"
                />
              ) : (
                <div className="order-item-placeholder">🛍️</div>
              )}
              <div className="order-item-info">
                <h4 className="order-item-name">{item.product_title || `Product #${item.product_id}`}</h4>
                <div className="order-item-meta">
                  <span>Qty: <strong>{item.quantity}</strong></span>
                  <span>•</span>
                  <span>Unit Price: <strong>{formatINR(item.unit_price)}</strong></span>
                </div>
              </div>
              <div className="order-item-total">
                {formatINR(item.unit_price * item.quantity)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
