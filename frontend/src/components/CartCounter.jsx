import { useState } from 'react'

export default function CartCounter() {
  // 1. State: Component memory to track current quantity
  const [quantity, setQuantity] = useState(0)

  // 2. Constants
  const PRICE_PER_ITEM = 29.99

  // 3. Event Handlers
  const handleIncrease = () => {
    setQuantity(quantity + 1)
  }

  const handleDecrease = () => {
    // Guard clause: don't allow quantity to drop below 0
    if (quantity > 0) {
      setQuantity(quantity - 1)
    }
  }

  const handleReset = () => {
    setQuantity(0)
  }

  // 4. Derived State: calculated dynamically on every render
  const totalPrice = (quantity * PRICE_PER_ITEM).toFixed(2)

  return (
    <section className="handshake-box" style={{ marginTop: '2rem' }}>
      <div className="handshake-header">
        <div>
          <span className="badge-phase" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>
            Side Quest: React State in Action
          </span>
          <h2 className="handshake-title">🎧 Sony Wireless Noise-Canceling Headphones</h2>
          <p className="card-detail">
            Unit Price: <strong style={{ color: 'var(--accent-gold)' }}>${PRICE_PER_ITEM}</strong>
          </p>
        </div>

        {/* Counter Buttons & Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            className="btn-outline"
            style={{ width: '42px', height: '42px', justifyContent: 'center', fontSize: '1.25rem' }}
            onClick={handleDecrease}
            disabled={quantity === 0}
            title="Decrease quantity"
          >
            -
          </button>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.5rem',
              fontWeight: '700',
              minWidth: '40px',
              textAlign: 'center',
              color: quantity > 0 ? 'var(--accent-gold)' : 'var(--text-muted)'
            }}
          >
            {quantity}
          </span>

          <button
            className="btn-primary"
            style={{ width: '42px', height: '42px', justifyContent: 'center', fontSize: '1.25rem', padding: 0 }}
            onClick={handleIncrease}
            title="Increase quantity"
          >
            '1'
          </button>

          {quantity > 0 && (
            <button
              className="btn-outline"
              style={{ fontSize: '0.8rem', padding: '0.4rem 0.8rem' }}
              onClick={handleReset}
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Cart Summary Banner */}
      <div
        style={{
          marginTop: '1.25rem',
          padding: '1rem 1.25rem',
          borderRadius: '10px',
          background: quantity > 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(255, 255, 255, 0.03)',
          border: quantity > 0 ? '1px solid rgba(16, 185, 129, 0.3)' : '1px solid var(--border)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.5rem'
        }}
      >
        <div>
          {quantity > 0 ? (
            <span style={{ color: 'var(--accent-green)', fontWeight: '600' }}>
              🛒 {quantity} {quantity === 1 ? 'item' : 'items'} in your cart
            </span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>
              Your cart is empty. Click <strong>'+'</strong> above to add an item.
            </span>
          )}
        </div>

        <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.1rem', fontWeight: '700' }}>
          Subtotal: <span style={{ color: quantity > 0 ? 'var(--text-primary)' : 'var(--text-muted)' }}>${totalPrice}</span>
        </div>
      </div>
    </section>
  )
}
