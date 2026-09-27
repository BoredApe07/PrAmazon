import { useState, useEffect } from 'react'
import { createProduct } from '../services/api'
import './AdminProductModal.css'

/**
 * AdminProductModal Component
 * Allows administrators to add new products to the catalog.
 * 
 * @param {Object} props
 * @param {Function} props.onClose - Callback to close modal
 * @param {Function} props.onProductCreated - Callback when product is created successfully
 * @param {string[]} props.categories - Existing category list
 */
export default function AdminProductModal({ onClose, onProductCreated, categories = [] }) {
  const [formData, setFormData] = useState({
    title: '',
    category: categories[0] || 'Electronics',
    customCategory: '',
    price: '',
    stock: '15',
    imageUrl: '',
    description: '',
  })
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  // Close modal when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCategorySelect = (e) => {
    const val = e.target.value
    if (val === '__custom__') {
      setIsCustomCategory(true)
      setFormData((prev) => ({ ...prev, category: '' }))
    } else {
      setIsCustomCategory(false)
      setFormData((prev) => ({ ...prev, category: val }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)

    const finalCategory = isCustomCategory
      ? formData.customCategory.trim()
      : formData.category.trim()

    if (!formData.title.trim()) {
      setError('Please provide a product title.')
      return
    }

    if (!finalCategory) {
      setError('Please specify a product category.')
      return
    }

    const numPrice = parseFloat(formData.price)
    if (isNaN(numPrice) || numPrice <= 0) {
      setError('Price must be a valid positive number.')
      return
    }

    const numStock = parseInt(formData.stock, 10)
    if (isNaN(numStock) || numStock < 0) {
      setError('Stock quantity must be a non-negative integer.')
      return
    }

    setLoading(true)

    try {
      const payload = {
        title: formData.title.trim(),
        category: finalCategory,
        price: numPrice,
        stock: numStock,
        description: formData.description.trim() || null,
        image_url: formData.imageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80',
        rating: 4.5,
        rating_count: 0,
      }

      const newProduct = await createProduct(payload)
      if (onProductCreated) {
        onProductCreated(newProduct)
      }
      onClose()
    } catch (err) {
      setError(err.message || 'Failed to add product.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-overlay" onClick={onClose}>
      <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="admin-header">
          <div className="admin-header-title">
            <span className="admin-icon">⚡</span>
            <div>
              <h2>Add New Product</h2>
              <span className="admin-badge">Admin Portal</span>
            </div>
          </div>
          <button className="admin-close-btn" onClick={onClose} title="Close">
            ✕
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="admin-form">
          {error && (
            <div className="admin-error-alert">
              <span className="alert-icon">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Product Title */}
          <div className="form-group">
            <label htmlFor="title">Product Title *</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              placeholder="e.g. Sony WH-1000XM5 Wireless Headphones"
              value={formData.title}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Category Selector */}
          <div className="form-row">
            <div className="form-group flex-1">
              <label htmlFor="category">Category *</label>
              {!isCustomCategory ? (
                <div className="category-select-wrapper">
                  <select
                    id="category"
                    value={formData.category}
                    onChange={handleCategorySelect}
                    disabled={loading}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="__custom__">➕ New Category...</option>
                  </select>
                </div>
              ) : (
                <div className="custom-category-group">
                  <input
                    type="text"
                    name="customCategory"
                    placeholder="Enter new category name..."
                    value={formData.customCategory}
                    onChange={handleChange}
                    autoFocus
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className="cancel-custom-cat-btn"
                    onClick={() => {
                      setIsCustomCategory(false)
                      setFormData((prev) => ({
                        ...prev,
                        category: categories[0] || 'Electronics',
                        customCategory: '',
                      }))
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Price in INR */}
            <div className="form-group flex-1">
              <label htmlFor="price">Price (₹ INR) *</label>
              <input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="1"
                required
                placeholder="e.g. 24999"
                value={formData.price}
                onChange={handleChange}
                disabled={loading}
              />
            </div>

            {/* Initial Stock */}
            <div className="form-group flex-1">
              <label htmlFor="stock">Initial Stock *</label>
              <input
                id="stock"
                name="stock"
                type="number"
                min="0"
                required
                placeholder="e.g. 15"
                value={formData.stock}
                onChange={handleChange}
                disabled={loading}
              />
            </div>
          </div>

          {/* Image URL with Live Thumbnail Preview */}
          <div className="form-group">
            <label htmlFor="imageUrl">Product Image URL</label>
            <div className="image-input-wrapper">
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={formData.imageUrl}
                onChange={handleChange}
                disabled={loading}
              />
              {formData.imageUrl && (
                <img
                  src={formData.imageUrl}
                  alt="Preview"
                  className="image-preview-thumb"
                  onError={(e) => {
                    e.target.style.display = 'none'
                  }}
                />
              )}
            </div>
            <span className="field-hint">
              Leave blank to use a high-quality default product image.
            </span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label htmlFor="description">Product Description</label>
            <textarea
              id="description"
              name="description"
              rows="3"
              placeholder="Highlight key specs, features, warranty, and package contents..."
              value={formData.description}
              onChange={handleChange}
              disabled={loading}
            />
          </div>

          {/* Submit & Cancel Buttons */}
          <div className="admin-actions">
            <button
              type="button"
              className="admin-cancel-btn"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="admin-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <span className="admin-spinner-wrapper">
                  <span className="admin-spinner"></span>
                  <span>Adding to Catalog...</span>
                </span>
              ) : (
                'Add Product to Store'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
