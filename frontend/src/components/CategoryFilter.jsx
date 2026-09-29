import './CategoryFilter.css'

/**
 * CategoryFilter Component
 * Renders interactive category pill buttons allowing users to filter products.
 * Also includes an In-Stock Only toggle chip.
 * 
 * @param {Object} props
 * @param {string[]} props.categories - List of unique category names from backend
 * @param {string} props.selectedCategory - The currently active category ('' means All)
 * @param {Function} props.onSelectCategory - Callback function when a category pill is clicked
 * @param {boolean} props.inStockOnly - Whether in-stock only filter is active
 * @param {Function} props.onToggleInStock - Callback function to toggle in-stock filter
 */
export default function CategoryFilter({
  categories,
  selectedCategory,
  onSelectCategory,
  inStockOnly = false,
  onToggleInStock
}) {
  return (
    <div className="category-filter-bar">
      {/* "All" button to clear category filters */}
      <button
        type="button"
        className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
        onClick={() => onSelectCategory('')}
      >
        All Products
      </button>

      {/* Dynamic category pills from backend */}
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

      {/* In-Stock Only Toggle Pill */}
      {onToggleInStock && (
        <button
          type="button"
          className={`category-pill in-stock-pill ${inStockOnly ? 'in-stock-active' : ''}`}
          onClick={onToggleInStock}
          title={inStockOnly ? 'Showing in-stock items only. Click to show all' : 'Click to hide out-of-stock items'}
        >
          <span className="in-stock-indicator">{inStockOnly ? '✓' : '📦'}</span>
          <span>In Stock Only</span>
        </button>
      )}
    </div>
  )
}
