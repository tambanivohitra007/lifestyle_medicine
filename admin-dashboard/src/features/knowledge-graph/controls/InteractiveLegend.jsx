import { memo } from 'react';

const LEGEND_ITEMS = [
  { type: 'condition', label: 'Condition', color: '#ef4444' },
  { type: 'intervention', label: 'Intervention', color: '#f43f5e' },
  { type: 'careDomain', label: 'Care Domain', color: '#3b82f6' },
  { type: 'scripture', label: 'Scripture', color: '#6366f1' },
  { type: 'egwReference', label: 'EGW Reference', color: '#8b5cf6' },
  { type: 'recipe', label: 'Recipe', color: '#f59e0b' },
  { type: 'evidenceEntry', label: 'Evidence', color: '#10b981' },
  { type: 'reference', label: 'Reference', color: '#64748b' },
];

/**
 * Interactive legend that allows toggling visibility of node types.
 * Click on an item to toggle its visibility.
 */
const InteractiveLegend = memo(({ hiddenTypes = [], onToggleType }) => {
  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
      <div className="text-xs font-medium text-gray-700 mb-2">
        Legend
        <span className="text-[10px] text-gray-400 font-normal ml-1">(click to toggle)</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        {LEGEND_ITEMS.map((item) => {
          const isHidden = hiddenTypes.includes(item.type);
          return (
            <button
              key={item.type}
              onClick={() => onToggleType(item.type)}
              className={`
                flex items-center gap-1.5 py-0.5 px-1 rounded transition-all text-left
                hover:bg-gray-50
                ${isHidden ? 'opacity-40' : 'opacity-100'}
              `}
              title={isHidden ? `Show ${item.label}` : `Hide ${item.label}`}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-transform ${
                  isHidden ? 'scale-75' : 'scale-100'
                }`}
                style={{ backgroundColor: item.color }}
              />
              <span className={isHidden ? 'line-through text-gray-400' : ''}>
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
      {hiddenTypes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          {hiddenTypes.length} type{hiddenTypes.length > 1 ? 's' : ''} hidden
        </div>
      )}
    </div>
  );
});

InteractiveLegend.displayName = 'InteractiveLegend';

export default InteractiveLegend;
