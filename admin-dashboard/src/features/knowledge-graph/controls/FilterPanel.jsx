import { Filter, Eye, EyeOff } from 'lucide-react';

const NODE_TYPE_CONFIG = [
  { type: 'condition', label: 'Conditions', color: '#ef4444' },
  { type: 'intervention', label: 'Interventions', color: '#f43f5e' },
  { type: 'careDomain', label: 'Care Domains', color: '#3b82f6' },
  { type: 'scripture', label: 'Scriptures', color: '#6366f1' },
  { type: 'egwReference', label: 'EGW References', color: '#8b5cf6' },
  { type: 'recipe', label: 'Recipes', color: '#f59e0b' },
  { type: 'evidenceEntry', label: 'Evidence', color: '#10b981' },
  { type: 'reference', label: 'References', color: '#64748b' },
];

const FilterPanel = ({ hiddenTypes = [], onToggleType, onShowAll, onHideAll }) => {
  const visibleCount = NODE_TYPE_CONFIG.length - hiddenTypes.length;

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3 min-w-[180px]">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-gray-500" />
          <span className="text-xs font-medium text-gray-700">Filter Nodes</span>
        </div>
        <span className="text-[10px] text-gray-400">
          {visibleCount}/{NODE_TYPE_CONFIG.length}
        </span>
      </div>

      <div className="space-y-1.5 mb-3">
        {NODE_TYPE_CONFIG.map(({ type, label, color }) => {
          const isHidden = hiddenTypes.includes(type);
          return (
            <button
              key={type}
              onClick={() => onToggleType(type)}
              className={`w-full flex items-center gap-2 px-2 py-1.5 rounded text-xs transition-colors ${
                isHidden
                  ? 'bg-gray-50 text-gray-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full flex-shrink-0 transition-opacity ${
                  isHidden ? 'opacity-30' : ''
                }`}
                style={{ backgroundColor: color }}
              />
              <span className="flex-1 text-left">{label}</span>
              {isHidden ? (
                <EyeOff className="w-3 h-3 text-gray-400" />
              ) : (
                <Eye className="w-3 h-3 text-gray-500" />
              )}
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 pt-2 border-t border-gray-100">
        <button
          onClick={onShowAll}
          className="flex-1 text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Show All
        </button>
        <button
          onClick={onHideAll}
          className="flex-1 text-[10px] px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
        >
          Hide All
        </button>
      </div>
    </div>
  );
};

export default FilterPanel;
