/**
 * SearchBar Component
 * Reusable controlled input component for searching courses by title or instructor.
 *
 * Props:
 *   - value: string (the current search text)
 *   - onChange: function (event handler called when search text changes)
 *   - placeholder: string (optional placeholder text)
 */
export default function SearchBar({
  value,
  onChange,
  placeholder = 'Search courses by title or instructor'
}) {
  return (
    <div className="search-bar-container">
      <span className="search-bar-icon" aria-hidden="true">
        🔍
      </span>
      <input
        type="text"
        className="search-input"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        aria-label="Search courses by title or instructor"
      />
    </div>
  );
}
