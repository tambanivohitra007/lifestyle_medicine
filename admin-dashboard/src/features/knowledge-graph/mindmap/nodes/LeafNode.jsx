import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  FileText,
  ChefHat,
  BookOpen,
  BookHeart,
  Info,
} from 'lucide-react';

// Icon mapping by node category
const CATEGORY_ICONS = {
  sectionItem: FileText,
  recipe: ChefHat,
  scripture: BookOpen,
  egwReference: BookHeart,
};

/**
 * Leaf Node - Non-expandable terminal node
 * Used for section items, recipes, scriptures, EGW references
 */
const LeafNode = memo(({ data, selected }) => {
  const color = data.color || '#6b7280';
  const Icon = CATEGORY_ICONS[data.nodeCategory] || FileText;

  // Truncate label for display
  const displayLabel = data.label?.length > 35
    ? `${data.label.substring(0, 35)}...`
    : data.label;

  // Get subtitle based on category
  const getSubtitle = () => {
    switch (data.nodeCategory) {
      case 'sectionItem':
        return data.sectionLabel;
      case 'recipe':
        return data.dietaryTags?.slice(0, 2).join(', ') || 'Recipe';
      case 'scripture':
        return data.theme || 'Scripture';
      case 'egwReference':
        return data.book || 'Spirit of Prophecy';
      default:
        return null;
    }
  };

  const subtitle = getSubtitle();

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg shadow-md border-2 transition-all duration-300
        bg-white min-w-[120px] max-w-[170px]
        ${selected ? 'shadow-lg scale-105 ring-2 ring-offset-1' : 'hover:shadow-lg hover:scale-102'}
      `}
      style={{
        borderColor: color,
        '--tw-ring-color': color,
      }}
    >
      {/* Connection handle */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2 !h-2 !border-2 !border-white"
        style={{ background: color }}
      />

      {/* Content */}
      <div className="flex items-start gap-2">
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-medium text-xs text-gray-800 leading-tight">
            {displayLabel}
          </div>
          {subtitle && (
            <div
              className="mt-0.5 text-[10px] font-medium truncate"
              style={{ color }}
            >
              {subtitle}
            </div>
          )}
        </div>
      </div>

      {/* Content indicator */}
      {(data.body || data.text || data.quote || data.description) && (
        <div
          className="absolute -bottom-1 -right-1 p-0.5 rounded-full bg-white border shadow-sm"
          style={{ borderColor: color }}
          title="Click to view details"
        >
          <Info className="w-2.5 h-2.5" style={{ color }} />
        </div>
      )}
    </div>
  );
});

LeafNode.displayName = 'LeafNode';

export default LeafNode;
