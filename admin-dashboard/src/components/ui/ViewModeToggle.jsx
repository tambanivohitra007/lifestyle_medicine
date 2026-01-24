import { LayoutGrid, List, Table } from 'lucide-react';

/**
 * Toggle component for switching between different view modes
 *
 * @param {string} viewMode - Current view mode: 'grid', 'list', or 'table'
 * @param {function} onViewModeChange - Callback when view mode changes
 * @param {string} className - Additional CSS classes
 */
const ViewModeToggle = ({ viewMode, onViewModeChange, className = '' }) => {
  const modes = [
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'list', label: 'List', icon: List },
    { id: 'table', label: 'Table', icon: Table },
  ];

  return (
    <div className={`inline-flex rounded-lg border border-gray-300 bg-white p-1 ${className}`}>
      {modes.map((mode) => {
        const Icon = mode.icon;
        const isActive = viewMode === mode.id;

        return (
          <button
            key={mode.id}
            onClick={() => onViewModeChange(mode.id)}
            className={`
              flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium
              transition-all duration-200
              ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
              }
            `}
            aria-label={`${mode.label} view`}
            aria-pressed={isActive}
            type="button"
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{mode.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ViewModeToggle;
