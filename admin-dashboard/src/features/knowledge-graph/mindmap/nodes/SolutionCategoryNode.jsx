import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import {
  Utensils,
  Dumbbell,
  Droplets,
  BookHeart,
  Brain,
  HeartPulse,
  Pill,
  Leaf,
  CircleDot,
} from 'lucide-react';

const DOMAIN_ICONS = {
  nutrition: Utensils,
  exercise: Dumbbell,
  hydrotherapy: Droplets,
  'spiritual-care': BookHeart,
  'mental-health': Brain,
  'stress-management': HeartPulse,
  pharmacotherapy: Pill,
  'natural-remedies': Leaf,
};

/**
 * Solution category node - represents a care domain branch
 */
const SolutionCategoryNode = memo(({ data, selected }) => {
  const domainSlug = data.name?.toLowerCase().replace(/\s+/g, '-') || '';
  const Icon = DOMAIN_ICONS[domainSlug] || CircleDot;
  const color = data.color || '#6b7280';

  const totalItems =
    (data.interventionCount || 0) +
    (data.scriptureCount || 0) +
    (data.egwCount || 0);

  return (
    <div
      className={`
        relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-gray-50
        min-w-[160px] max-w-[200px]
        ${selected ? 'shadow-xl scale-105' : 'hover:shadow-xl hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        className="!w-2 !h-2"
        style={{ background: color }}
      />

      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div
          className="p-2 rounded-lg shadow-sm"
          style={{ backgroundColor: color }}
        >
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="font-bold text-sm text-gray-800">
            {data.name}
          </div>
          {totalItems > 0 && (
            <div className="text-[10px] text-gray-500">
              {totalItems} item{totalItems !== 1 ? 's' : ''}
            </div>
          )}
        </div>
      </div>

      {/* Stats badges */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex flex-wrap gap-1">
        {data.interventionCount > 0 && (
          <span
            className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white"
            style={{ backgroundColor: color }}
          >
            {data.interventionCount} intervention{data.interventionCount !== 1 ? 's' : ''}
          </span>
        )}
        {data.scriptureCount > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-indigo-100 text-indigo-700">
            {data.scriptureCount} scripture{data.scriptureCount !== 1 ? 's' : ''}
          </span>
        )}
        {data.egwCount > 0 && (
          <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold bg-purple-100 text-purple-700">
            {data.egwCount} EGW
          </span>
        )}
      </div>
    </div>
  );
});

SolutionCategoryNode.displayName = 'SolutionCategoryNode';

export default SolutionCategoryNode;
