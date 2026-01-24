import { ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';

/**
 * Reusable sortable header component for tables and lists
 *
 * @param {string} field - The field name to sort by
 * @param {string} label - The display label for the header
 * @param {string} currentSort - The currently active sort field
 * @param {string} currentOrder - The current sort order ('asc' or 'desc')
 * @param {function} onSort - Callback function when header is clicked
 * @param {string} className - Additional CSS classes
 */
const SortableHeader = ({
  field,
  label,
  currentSort,
  currentOrder,
  onSort,
  className = ''
}) => {
  const isActive = currentSort === field;

  const handleClick = () => {
    if (isActive) {
      // Toggle between asc and desc
      onSort(field, currentOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending when clicking a new column
      onSort(field, 'asc');
    }
  };

  const renderIcon = () => {
    if (!isActive) {
      return <ChevronsUpDown className="w-4 h-4 text-gray-400" />;
    }

    return currentOrder === 'asc'
      ? <ChevronUp className="w-4 h-4 text-primary-600" />
      : <ChevronDown className="w-4 h-4 text-primary-600" />;
  };

  return (
    <button
      onClick={handleClick}
      className={`
        flex items-center gap-2 font-semibold transition-colors
        hover:text-primary-600 focus:outline-none focus:text-primary-600
        ${isActive ? 'text-primary-600' : 'text-gray-700'}
        ${className}
      `}
      type="button"
      aria-label={`Sort by ${label}`}
      aria-sort={isActive ? currentOrder : 'none'}
    >
      <span>{label}</span>
      {renderIcon()}
    </button>
  );
};

export default SortableHeader;
