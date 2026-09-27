import { useState, useRef, useEffect } from 'react'
import { loginUser, registerUser } from '../services/api'
import './AuthModal.css'

/**
 * AuthModal Component
 * Allows users to Sign In or Create a new PrAmazon account.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close the modal
 * @param {Function} props.onLoginSuccess - Callback invoked on successful auth: (user, token) => void
 * @param {string} [props.initialMode='signin'] - 'signin' or 'register'
 */
export default function AuthModal({ onClose, onLoginSuccess, initialMode = 'signin' }) {
  const [mode, setMode] = useState(initialMode) // 'signin' or 'register'
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // DOM Refs to programmatically manage input focus
  const nameInputRef = useRef(null)
  const emailInputRef = useRef(null)

  // Automatically shift focus to the first field whenever mode switches
  useEffect(() => {
    if (mode === 'register') {
      nameInputRef.current?.focus()
    } else {
      emailInputRef.current?.focus()
    }
  }, [mode])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // 1. If in register mode, create the account first
      if (mode === 'register') {
        await registerUser({
          name: formData.name.trim(),
          email: formData.email.trim(),
          password: formData.password,
        })
      }

      // 2. Both register and signin modes log in to retrieve the JWT
      const tokenData = await loginUser({
        email: formData.email.trim(),
        password: formData.password,
      })

      // 3. Hand off the authenticated user and token to the parent handler
      onLoginSuccess(tokenData.user, tokenData.access_token)
      onClose()
    } catch (err) {
      setError(err.message || 'An error occurred during authentication.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="auth-header">
          <div className="auth-brand">
            <span className="auth-brand-main">Pr</span>
            <span className="auth-brand-accent">Amazon</span>
          </div>
          <button className="auth-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Tab Toggle */}
        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab ${mode === 'signin' ? 'active' : ''}`}
            onClick={() => {
              setMode('signin')
              setError(null)
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab ${mode === 'register' ? 'active' : ''}`}
            onClick={() => {
              setMode('register')
              setError(null)
            }}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-title">
            {mode === 'signin' ? 'Sign in to your account' : 'Create your PrAmazon account'}
          </h2>

          {error && (
            <div className="auth-error-banner">
              <span className="auth-error-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="auth-name">Your Name</label>
              <input
                ref={nameInputRef}
                id="auth-name"
                type="text"
                name="name"
                placeholder="First and last name"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="auth-email">Email Address</label>
            <input
              ref={emailInputRef}
              id="auth-email"
              type="email"
              name="email"
              placeholder="e.g. alex@example.com"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="auth-field">
            <label htmlFor="auth-password">Password</label>
            <input
              id="auth-password"
              type="password"
              name="password"
              placeholder={mode === 'register' ? 'At least 6 characters' : 'Enter your password'}
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="auth-spinner-wrapper">
                <span className="auth-spinner"></span>
                <span>{mode === 'signin' ? 'Signing In...' : 'Creating Account...'}</span>
              </span>
            ) : mode === 'signin' ? (
              'Sign In'
            ) : (
              'Create Account'
            )}
          </button>

          <div className="auth-footer-help">
            {mode === 'signin' ? (
              <p>
                New to PrAmazon?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setMode('register')
                    setError(null)
                  }}
                >
                  Create your account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="auth-switch-link"
                  onClick={() => {
                    setMode('signin')
                    setError(null)
                  }}
                >
                  Sign in
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
