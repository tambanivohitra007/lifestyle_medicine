import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';

/**
 * Breadcrumbs component for navigation hierarchy
 *
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items: { label: string, href?: string }
 *   - Items with href are clickable links
 *   - Last item (or items without href) are displayed as text
 * @param {boolean} props.showBackButton - Show a back button (default: true for sub-pages)
 * @param {string} props.backTo - Custom back navigation path (defaults to first item's href or browser back)
 * @param {string} props.backLabel - Custom back button label (default: "Back")
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Conditions', href: '/conditions' },
 *   { label: 'Diabetes', href: '/conditions/123' },
 *   { label: 'Edit Section' }
 * ]} />
 */
const Breadcrumbs = ({ items = [], showBackButton = true, backTo, backLabel }) => {
  const navigate = useNavigate();

  if (items.length === 0) return null;

  // Determine back navigation - use backTo prop, first item's href, or browser back
  const handleBack = () => {
    if (backTo) {
      navigate(backTo);
    } else if (items.length > 0 && items[0].href) {
      navigate(items[0].href);
    } else {
      navigate(-1);
    }
  };

  // Determine back label - use backLabel prop or first item's label
  const computedBackLabel = backLabel || (items.length > 0 ? items[0].label : 'Back');

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4">
      {/* Back Button - prominent on mobile */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1.5 -ml-2 rounded-lg hover:bg-gray-100 active:bg-gray-200 sm:px-3 sm:py-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="sm:hidden">Back</span>
          <span className="hidden sm:inline">{computedBackLabel}</span>
        </button>
      )}

      {/* Breadcrumb Navigation - hidden on mobile, visible on sm+ */}
      <nav aria-label="Breadcrumb" className="hidden sm:block">
        <ol className="flex items-center flex-wrap gap-1 text-sm">
          {/* Home link */}
          <li className="flex items-center">
            <Link
              to="/"
              className="text-gray-500 hover:text-gray-700 transition-colors p-1 rounded hover:bg-gray-100"
              title="Dashboard"
            >
              <Home className="w-4 h-4" />
            </Link>
          </li>

          {/* Breadcrumb items */}
          {items.map((item, index) => {
            const isLast = index === items.length - 1;
            const hasLink = item.href && !isLast;

            return (
              <li key={index} className="flex items-center">
                <ChevronRight className="w-4 h-4 text-gray-400 mx-1 flex-shrink-0" />
                {hasLink ? (
                  <Link
                    to={item.href}
                    className="text-gray-500 hover:text-gray-700 transition-colors px-1 py-0.5 rounded hover:bg-gray-100 truncate max-w-[200px]"
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-gray-900 font-medium truncate max-w-[200px]"
                    title={item.label}
                  >
                    {item.label}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Mobile: Show current page title */}
      <div className="sm:hidden text-xs text-gray-500">
        {items.length > 0 && items[items.length - 1].label}
      </div>
    </div>
  );
};

export default Breadcrumbs;
