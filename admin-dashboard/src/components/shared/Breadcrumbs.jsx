import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, Home, ArrowLeft } from 'lucide-react';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation('common');
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
  const computedBackLabel = backLabel || (items.length > 0 ? items[0].label : t('buttons.back'));

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-4 bg-rose-700 px-4 py-2 rounded-xl">
      {/* Back Button - hidden on mobile (appbar already has one), visible on sm+ */}
      {showBackButton && (
        <button
          onClick={handleBack}
          className="hidden sm:inline-flex items-center gap-1.5 text-sm text-white/80 hover:text-white transition-colors px-3 py-1.5 -ml-2 rounded-lg hover:bg-white/10 active:bg-white/20"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{computedBackLabel}</span>
        </button>
      )}

      {/* Breadcrumb Navigation - hidden on mobile, visible on sm+ */}
      <nav aria-label="Breadcrumb" className="hidden sm:block">
        <ol className="flex items-center flex-wrap gap-1 text-sm">
          {/* Home link */}
          <li className="flex items-center">
            <Link
              to="/"
              className="text-white/70 hover:text-white transition-colors p-1 rounded hover:bg-white/10"
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
                <ChevronRight className="w-4 h-4 text-white/40 mx-1 flex-shrink-0" />
                {hasLink ? (
                  <Link
                    to={item.href}
                    className="text-white/70 hover:text-white transition-colors px-1 py-0.5 rounded hover:bg-white/10 truncate max-w-[200px]"
                    title={item.label}
                  >
                    {item.label}
                  </Link>
                ) : (
                  <span
                    className="text-white font-medium truncate max-w-[200px]"
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
      <div className="sm:hidden text-xs text-white/70">
        {items.length > 0 && items[items.length - 1].label}
      </div>
    </div>
  );
};

export default Breadcrumbs;
