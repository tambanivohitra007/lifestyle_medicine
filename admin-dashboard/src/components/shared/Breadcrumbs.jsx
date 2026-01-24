import { Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

/**
 * Breadcrumbs component for navigation hierarchy
 *
 * @param {Object} props
 * @param {Array} props.items - Array of breadcrumb items: { label: string, href?: string }
 *   - Items with href are clickable links
 *   - Last item (or items without href) are displayed as text
 *
 * @example
 * <Breadcrumbs items={[
 *   { label: 'Conditions', href: '/conditions' },
 *   { label: 'Diabetes', href: '/conditions/123' },
 *   { label: 'Edit Section' }
 * ]} />
 */
const Breadcrumbs = ({ items = [] }) => {
  if (items.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-4">
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
  );
};

export default Breadcrumbs;
