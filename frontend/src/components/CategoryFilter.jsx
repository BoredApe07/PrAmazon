import './CategoryFilter.css'

/**
 * CategoryFilter Component
 * - Desktop: Renders interactive category pill buttons.
 * - Mobile: Renders a sleek dropdown selector (no tedious horizontal scrolling!)
 *   alongside an In-Stock Only toggle chip.
 */
export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  inStockOnly = false,
  onToggleInStock
}) {
  return (
    <div className="category-filter-container">
      {/* 1. Desktop Pill Filter Bar (Screens > 640px) */}
      <div className="category-desktop-bar">
        <button
          type="button"
          className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
          onClick={() => onSelectCategory('')}
        >
          All Products
        </button>

        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
            onClick={() => onSelectCategory(cat)}
          >
            {cat}
          </button>
        ))}

        {onToggleInStock && (
          <button
            type="button"
            className={`category-pill in-stock-pill ${inStockOnly ? 'in-stock-active' : ''}`}
            onClick={onToggleInStock}
            title={inStockOnly ? 'Showing in-stock items only' : 'Click to hide out-of-stock items'}
          >
            <span className="in-stock-indicator">{inStockOnly ? '✓' : '📦'}</span>
            <span>In Stock Only</span>
          </button>
        )}
      </div>

      {/* 2. Mobile Dropdown Selector (Screens <= 640px: No scrolling required!) */}
      <div className="category-mobile-bar">
        <div className="category-select-wrapper">
          <select
            className="category-mobile-select"
            value={selectedCategory}
            onChange={(e) => onSelectCategory(e.target.value)}
            aria-label="Filter by category"
          >
            <option value="">📂 All Categories ({categories.length})</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <span className="category-select-chevron">▾</span>
        </div>

        {onToggleInStock && (
          <button
            type="button"
            className={`category-pill in-stock-pill mobile-in-stock-btn ${inStockOnly ? 'in-stock-active' : ''}`}
            onClick={onToggleInStock}
            title={inStockOnly ? 'Showing in-stock items only' : 'Click to hide out-of-stock items'}
          >
            <span className="in-stock-indicator">{inStockOnly ? '✓' : '📦'}</span>
            <span>In Stock</span>
          </button>
        )}
      </div>
    </div>
  )
}
