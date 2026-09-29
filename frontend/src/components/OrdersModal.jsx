import { useState, useEffect } from 'react'
import { fetchOrders, cancelOrder, updateOrderStatus } from '../services/api'
import './OrdersModal.css'

/**
 * OrdersModal Component
 * Displays past placed orders, live order tracking by ID, and delivery status.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the modal
 */
export default function OrdersModal({ onClose, onViewProduct, currentUser, onOrderCancelled }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Pagination & Filtering state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalOrders, setTotalOrders] = useState(0)
  const [statusFilter, setStatusFilter] = useState('')
  const ORDERS_PER_PAGE = 10

  // Live search filter state
  const [searchTerm, setSearchTerm] = useState('')
  const [cancellingId, setCancellingId] = useState(null)
  const [cancelNotice, setCancelNotice] = useState(null)
  const [updatingStatusId, setUpdatingStatusId] = useState(null)

  // Handle status update by administrator
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingStatusId(orderId)
    try {
      const updatedOrder = await updateOrderStatus(orderId, newStatus)
      setOrders((prev) =>
        prev.map((o) => (o.id === orderId ? updatedOrder : o))
      )
    } catch (err) {
      alert(err.message || 'Failed to update order status')
    } finally {
      setUpdatingStatusId(null)
    }
  }

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
      onOrderCancelled()
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

  // Reset to page 1 whenever statusFilter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter])

  // Fetch paginated orders whenever user, page, or status filter changes
  const loadOrders = async (pageToFetch = currentPage, statusToFetch = statusFilter) => {
    setLoading(true)
    setError(null)
    try {
      const data = await fetchOrders(pageToFetch, ORDERS_PER_PAGE, statusToFetch)
      if (Array.isArray(data)) {
        setOrders(data)
        setTotalOrders(data.length)
        setTotalPages(1)
      } else {
        setOrders(data.items || [])
        setTotalOrders(data.total || 0)
        setTotalPages(data.total_pages || 1)
      }
    } catch (err) {
      setError(err.message || 'Unable to load orders')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadOrders(currentPage, statusFilter)
  }, [currentUser, currentPage, statusFilter])

  // Format currency in Indian Rupees without paise (e.g. ₹24,990)
  const formatINR = (amount) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(Math.round(amount))

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
        const matchesItem = order.items && order.items.some((item) =>
          (item.product?.title || '').toLowerCase().includes(cleanSearch)
        )
        return matchesId || matchesItem
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

        {/* Live Search Bar & Status Filters */}
        <div className="orders-lookup-bar">
          <div className="orders-lookup-form">
            <span className="lookup-icon">🔍</span>
            <input
              type="text"
              className="orders-lookup-input"
              placeholder="Search by Order ID (e.g. 1) or product name..."
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

          {/* Status Filter Pills */}
          <div className="orders-status-filter-pills">
            {[
              { label: 'All Orders', value: '' },
              { label: 'Confirmed', value: 'confirmed' },
              { label: 'Shipped', value: 'shipped' },
              { label: 'Out for Delivery', value: 'out_for_delivery' },
              { label: 'Delivered', value: 'delivered' },
              { label: 'Cancelled', value: 'cancelled' },
            ].map((tab) => (
              <button
                key={tab.value}
                type="button"
                className={`orders-filter-pill ${statusFilter === tab.value ? 'active' : ''}`}
                onClick={() => setStatusFilter(tab.value)}
              >
                {tab.label}
              </button>
            ))}
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
                    : totalOrders > 0
                    ? `Showing ${(currentPage - 1) * ORDERS_PER_PAGE + 1}–${Math.min(currentPage * ORDERS_PER_PAGE, totalOrders)} of ${totalOrders} Orders`
                    : '0 Orders'}
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
                  currentUser={currentUser}
                  onStatusChange={handleStatusChange}
                  updatingStatusId={updatingStatusId}
                />
              ))}

              {/* Amazon-Style Orders Pagination Bar */}
              {!loading && !error && totalPages > 1 && (
                <div className="orders-pagination-bar">
                  <button
                    className="orders-page-btn orders-nav-btn"
                    disabled={currentPage <= 1}
                    onClick={() => {
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                      const modalBody = document.querySelector('.orders-modal-body')
                      if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    &larr; Previous
                  </button>

                  <div className="orders-page-numbers">
                    <button
                      className={`orders-page-num ${currentPage === 1 ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(1)
                        const modalBody = document.querySelector('.orders-modal-body')
                        if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      1
                    </button>

                    {currentPage > 3 && <span className="orders-page-ellipsis">&hellip;</span>}

                    {[currentPage - 1, currentPage, currentPage + 1]
                      .filter((p) => p > 1 && p < totalPages)
                      .map((p) => (
                        <button
                          key={p}
                          className={`orders-page-num ${currentPage === p ? 'active' : ''}`}
                          onClick={() => {
                            setCurrentPage(p)
                            const modalBody = document.querySelector('.orders-modal-body')
                            if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
                          }}
                        >
                          {p}
                        </button>
                      ))}

                    {currentPage < totalPages - 2 && <span className="orders-page-ellipsis">&hellip;</span>}

                    <button
                      className={`orders-page-num ${currentPage === totalPages ? 'active' : ''}`}
                      onClick={() => {
                        setCurrentPage(totalPages)
                        const modalBody = document.querySelector('.orders-modal-body')
                        if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
                      }}
                    >
                      {totalPages}
                    </button>
                  </div>

                  <button
                    className="orders-page-btn orders-nav-btn"
                    disabled={currentPage >= totalPages}
                    onClick={() => {
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                      const modalBody = document.querySelector('.orders-modal-body')
                      if (modalBody) modalBody.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Next &rarr;
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Subcomponent to render a single Amazon-style order card with visual tracking
 */
function OrderCard({
  order,
  formatINR,
  formatDate,
  onCancelOrder,
  cancellingId,
  onViewProduct,
  currentUser,
  onStatusChange,
  updatingStatusId,
}) {
  const isCancelled = order.status === 'cancelled'
  const isDelivered = order.status === 'delivered'

  // Map fulfillment stage
  const stages = ['confirmed', 'shipped', 'out_for_delivery', 'delivered']
  const stageIndex = stages.indexOf(order.status)

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
            {order.user?.name || 'Customer'}
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
          ) : isDelivered ? (
            <div className="status-badge-group delivered">
              <span className="status-dot green">✓</span>
              <span className="status-text">Delivered — Package handed to customer</span>
            </div>
          ) : (
            <div className="status-badge-group in-transit">
              <span className="status-dot blue">●</span>
              <span className="status-text">
                {order.status === 'shipped'
                  ? 'Shipped — Package is in transit'
                  : order.status === 'out_for_delivery'
                  ? 'Out for Delivery — Arriving today'
                  : 'Confirmed — Preparing for Dispatch'}
              </span>
            </div>
          )}

          <div className="order-actions-group">
            <span className="payment-tag">Cash on Delivery</span>

            {/* Admin Status Fulfillment Dropdown */}
            {currentUser?.role === 'admin' && !isCancelled && (
              <div className="admin-status-control" title="Administrator fulfillment action">
                <span className="admin-status-prefix">⚡ Status:</span>
                <select
                  className="admin-status-select"
                  value={order.status}
                  onChange={(e) => onStatusChange(order.id, e.target.value)}
                  disabled={updatingStatusId === order.id}
                >
                  <option value="confirmed">Confirmed</option>
                  <option value="shipped">Shipped</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
                {updatingStatusId === order.id && <span className="status-mini-spinner"></span>}
              </div>
            )}

            {!isCancelled && !isDelivered && onCancelOrder && (
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

        {/* Amazon-style 4-Step Package Tracking Progress Bar */}
        {!isCancelled && (
          <div className="tracking-timeline-box">
            <div className="tracking-timeline">
              {/* Step 1: Ordered */}
              <div className={`tracking-step ${stageIndex >= 0 ? 'completed' : ''} ${stageIndex === 0 ? 'active' : ''}`}>
                <div className="tracking-node">{stageIndex >= 0 ? '✓' : '1'}</div>
                <span className="tracking-node-title">Ordered</span>
              </div>

              <div className={`tracking-bar-segment ${stageIndex >= 1 ? 'filled' : ''}`}></div>

              {/* Step 2: Shipped */}
              <div className={`tracking-step ${stageIndex >= 1 ? 'completed' : ''} ${stageIndex === 1 ? 'active' : ''}`}>
                <div className="tracking-node">{stageIndex >= 1 ? '✓' : '2'}</div>
                <span className="tracking-node-title">Shipped</span>
              </div>

              <div className={`tracking-bar-segment ${stageIndex >= 2 ? 'filled' : ''}`}></div>

              {/* Step 3: Out for Delivery */}
              <div className={`tracking-step ${stageIndex >= 2 ? 'completed' : ''} ${stageIndex === 2 ? 'active' : ''}`}>
                <div className="tracking-node">{stageIndex >= 2 ? '✓' : '3'}</div>
                <span className="tracking-node-title">Out for Delivery</span>
              </div>

              <div className={`tracking-bar-segment ${stageIndex >= 3 ? 'filled' : ''}`}></div>

              {/* Step 4: Delivered */}
              <div className={`tracking-step ${stageIndex >= 3 ? 'completed' : ''} ${stageIndex === 3 ? 'active' : ''}`}>
                <div className="tracking-node">{stageIndex >= 3 ? '✓' : '4'}</div>
                <span className="tracking-node-title">Delivered</span>
              </div>
            </div>
          </div>
        )}

        <p className="order-shipping-summary">
          <strong>Delivery Address:</strong> {order.shipping_address}
        </p>

        {/* Purchased Items List */}
        <div className="order-items-container">
          {order.items.map((item) => (
            <div 
              key={item.id} 
              className={`order-item-row ${onViewProduct ? 'clickable' : ''}`}
              onClick={() => onViewProduct && onViewProduct(item.product?.id)}
              title="Click to view product details"
            >
              {item.product?.image_url ? (
                <img
                  src={item.product?.image_url}
                  alt={item.product?.title || 'Product'}
                  className="order-item-thumb"
                />
              ) : (
                <div className="order-item-placeholder">🛍️</div>
              )}
              <div className="order-item-info">
                <h4 className="order-item-name">
                  {item.product?.title || `Product #${item.product?.id || ''}`}
                </h4>
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
