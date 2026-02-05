import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Stethoscope, ChevronRight, ChevronDown, ChefHat, FileCheck } from 'lucide-react';

/**
 * Expandable Intervention Node - Shows intervention with expand capability for recipes
 */
const ExpandableInterventionNode = memo(({ data, selected }) => {
  const color = data.color || '#f43f5e';

  // Truncate description
  const briefDescription = data.description
    ? data.description.length > 50
      ? `${data.description.substring(0, 50)}...`
      : data.description
    : null;

  return (
    <div
      className={`
        relative px-3 py-2.5 rounded-xl shadow-md border-2 transition-all duration-300
        bg-gradient-to-br from-white to-rose-50
        min-w-[150px] max-w-[200px]
        ${selected ? 'shadow-lg scale-105 ring-2 ring-offset-1' : 'hover:shadow-lg hover:scale-102'}
        ${data.expanded ? 'ring-2 ring-offset-1' : ''}
      `}
      style={{
        borderColor: color,
        '--tw-ring-color': color,
      }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!w-2.5 !h-2.5 !border-2 !border-white"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!w-2.5 !h-2.5 !border-2 !border-white"
        style={{ background: color }}
      />

      {/* Header */}
      <div className="flex items-start gap-2">
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: color }}
        >
          <Stethoscope className="w-3.5 h-3.5 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="font-semibold text-xs text-gray-800 leading-tight">
            {data.name || data.label}
          </div>
        </div>
      </div>

      {/* Brief description */}
      {briefDescription && (
        <div className="mt-1.5 text-[10px] text-gray-600 leading-snug">
          {briefDescription}
        </div>
      )}

      {/* Stats row */}
      <div className="mt-2 pt-2 border-t border-gray-100 flex items-center gap-2">
        {/* Evidence badge */}
        {data.strengthOfEvidence && (
          <span className={`
            inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium
            ${data.strengthOfEvidence === 'high' ? 'bg-green-100 text-green-700' : ''}
            ${data.strengthOfEvidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' : ''}
            ${data.strengthOfEvidence === 'emerging' ? 'bg-blue-100 text-blue-700' : ''}
            ${data.strengthOfEvidence === 'insufficient' ? 'bg-gray-100 text-gray-600' : ''}
          `}>
            {data.strengthOfEvidence}
          </span>
        )}

        {/* Recipe count */}
        {data.childCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600 ml-auto">
            <ChefHat className="w-3 h-3" />
            {data.childCount}
          </span>
        )}

        {/* Evidence count */}
        {data.evidenceCount > 0 && (
          <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600">
            <FileCheck className="w-3 h-3" />
            {data.evidenceCount}
          </span>
        )}
      </div>

      {/* Expand/Collapse indicator for recipes */}
      {data.expandable && data.childCount > 0 && (
        <div
          className="absolute -bottom-2 left-1/2 -translate-x-1/2 p-0.5 rounded-full bg-white border-2 shadow-sm cursor-pointer hover:scale-110 transition-transform"
          style={{ borderColor: '#f59e0b' }}
        >
          {data.expanded ? (
            <ChevronDown className="w-2.5 h-2.5 text-amber-500" />
          ) : (
            <ChevronRight className="w-2.5 h-2.5 text-amber-500" />
          )}
        </div>
      )}
    </div>
  );
});

ExpandableInterventionNode.displayName = 'ExpandableInterventionNode';

export default ExpandableInterventionNode;
