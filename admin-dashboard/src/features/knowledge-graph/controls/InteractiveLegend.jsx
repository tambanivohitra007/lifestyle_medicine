import { memo } from 'react';
import { useTranslation } from 'react-i18next';

const LEGEND_ITEMS_CONFIG = [
  { type: 'condition', labelKey: 'knowledgeGraph:nodes.condition', color: '#ef4444' },
  { type: 'intervention', labelKey: 'knowledgeGraph:nodes.intervention', color: '#f43f5e' },
  { type: 'careDomain', labelKey: 'knowledgeGraph:nodes.careDomain', color: '#3b82f6' },
  { type: 'scripture', labelKey: 'knowledgeGraph:nodes.scripture', color: '#6366f1' },
  { type: 'egwReference', labelKey: 'knowledgeGraph:nodes.egwReference', color: '#8b5cf6' },
  { type: 'recipe', labelKey: 'knowledgeGraph:nodes.recipe', color: '#f59e0b' },
  { type: 'evidenceEntry', labelKey: 'knowledgeGraph:nodes.evidence', color: '#10b981' },
  { type: 'reference', labelKey: 'knowledgeGraph:nodes.reference', color: '#64748b' },
];

const RELATIONSHIP_LEGEND = [
  { type: 'synergy', labelKey: 'knowledgeGraph:relationships.types.synergy', color: '#10b981', icon: '⚡' },
  { type: 'complementary', labelKey: 'knowledgeGraph:relationships.types.complementary', color: '#22c55e', icon: '✓' },
  { type: 'caution', labelKey: 'knowledgeGraph:relationships.types.caution', color: '#f59e0b', icon: '⚠' },
  { type: 'conflict', labelKey: 'knowledgeGraph:relationships.types.conflict', color: '#ef4444', icon: '✕' },
];

/**
 * Interactive legend that allows toggling visibility of node types.
 * Click on an item to toggle its visibility.
 */
const InteractiveLegend = memo(({ hiddenTypes = [], onToggleType }) => {
  const { t } = useTranslation(['knowledgeGraph']);

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-3">
      <div className="text-xs font-medium text-gray-700 mb-2">
        {t('knowledgeGraph:legend.title')}
        <span className="text-[10px] text-gray-400 font-normal ml-1">{t('knowledgeGraph:legend.clickToToggle')}</span>
      </div>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-[10px]">
        {LEGEND_ITEMS_CONFIG.map((item) => {
          const isHidden = hiddenTypes.includes(item.type);
          const label = t(item.labelKey);
          return (
            <button
              key={item.type}
              onClick={() => onToggleType(item.type)}
              className={`
                flex items-center gap-1.5 py-0.5 px-1 rounded transition-all text-left
                hover:bg-gray-50
                ${isHidden ? 'opacity-40' : 'opacity-100'}
              `}
              title={isHidden ? t('knowledgeGraph:legend.show', { type: label }) : t('knowledgeGraph:legend.hide', { type: label })}
            >
              <div
                className={`w-2.5 h-2.5 rounded-full transition-transform ${
                  isHidden ? 'scale-75' : 'scale-100'
                }`}
                style={{ backgroundColor: item.color }}
              />
              <span className={isHidden ? 'line-through text-gray-400' : ''}>
                {label}
              </span>
            </button>
          );
        })}
      </div>
      {hiddenTypes.length > 0 && (
        <div className="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-400 text-center">
          {t('knowledgeGraph:legend.typesHidden', { count: hiddenTypes.length })}
        </div>
      )}

      {/* Relationship Legend */}
      <div className="mt-3 pt-3 border-t border-gray-100">
        <div className="text-[10px] font-medium text-gray-600 mb-1.5">
          {t('knowledgeGraph:relationships.title')}
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-[9px]">
          {RELATIONSHIP_LEGEND.map((item) => (
            <div key={item.type} className="flex items-center gap-1.5">
              <span className="text-xs">{item.icon}</span>
              <div
                className="w-6 h-0.5 rounded"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{t(item.labelKey)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

InteractiveLegend.displayName = 'InteractiveLegend';

export default InteractiveLegend;
