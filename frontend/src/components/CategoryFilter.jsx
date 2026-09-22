import './CategoryFilter.css'

/**
 * CategoryFilter Component
 * Renders interactive category pill buttons allowing users to filter products.
 * 
 * @param {Object} props
 * @param {string[]} props.categories - List of unique category names from backend
 * @param {string} props.selectedCategory - The currently active category ('' means All)
 * @param {Function} props.onSelectCategory - Callback function when a category pill is clicked
 */
export default function CategoryFilter({ categories, selectedCategory, onSelectCategory }) {
  return (
    <div className="category-filter-bar">
      {/* "All" button to clear filters */}
      <button
        className={`category-pill ${selectedCategory === '' ? 'active' : ''}`}
        onClick={() => onSelectCategory('')}
      >
        All Products
      </button>

      {/* Dynamic category pills from backend */}
      {categories.map((cat) => (
        <button
          key={cat}
          className={`category-pill ${selectedCategory === cat ? 'active' : ''}`}
          onClick={() => onSelectCategory(cat)}
        >
          {cat}
        </button>
      ))}
    </div>
  )
}
