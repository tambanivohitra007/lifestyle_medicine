import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Stethoscope, ChefHat, FileCheck } from 'lucide-react';

/**
 * Intervention node for mindmap - shows name, brief description, and linked content counts
 */
const InterventionMindmapNode = memo(({ data, selected }) => {
  const color = data.color || '#f43f5e';

  // Truncate description for display
  const briefDescription = data.description
    ? data.description.length > 60
      ? `${data.description.substring(0, 60)}...`
      : data.description
    : null;

  const recipeCount = data.recipes?.length || 0;
  const evidenceCount = data.evidenceCount || 0;

  return (
    <div
      className={`
        relative px-3 py-2 rounded-lg shadow-md border-2 transition-all duration-200
        bg-gradient-to-br from-white to-rose-50
        min-w-[140px] max-w-[200px] cursor-pointer
        ${selected ? 'shadow-lg scale-105 border-rose-400' : 'hover:shadow-lg hover:scale-102'}
      `}
      style={{ borderColor: color }}
    >
      {/* Connection handles */}
      <Handle
        type="target"
        position={Position.Left}
        id="target"
        className="!w-2 !h-2"
        style={{ background: color }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source"
        className="!w-2 !h-2"
        style={{ background: color }}
      />

      {/* Header */}
      <div className="flex items-start gap-2">
        <div
          className="p-1.5 rounded-lg shrink-0"
          style={{ backgroundColor: color }}
        >
          <Stethoscope className="w-3 h-3 text-white" />
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

      {/* Evidence strength badge */}
      {data.strengthOfEvidence && (
        <div className="mt-1.5 flex items-center gap-1">
          <span className={`
            inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-medium
            ${data.strengthOfEvidence === 'high' ? 'bg-green-100 text-green-700' : ''}
            ${data.strengthOfEvidence === 'moderate' ? 'bg-yellow-100 text-yellow-700' : ''}
            ${data.strengthOfEvidence === 'emerging' ? 'bg-blue-100 text-blue-700' : ''}
            ${data.strengthOfEvidence === 'insufficient' ? 'bg-gray-100 text-gray-600' : ''}
          `}>
            {data.strengthOfEvidence}
          </span>
        </div>
      )}

      {/* Stats row */}
      {(recipeCount > 0 || evidenceCount > 0) && (
        <div className="mt-1.5 pt-1.5 border-t border-gray-100 flex items-center gap-2">
          {recipeCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-amber-600">
              <ChefHat className="w-2.5 h-2.5" />
              {recipeCount}
            </span>
          )}
          {evidenceCount > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[9px] text-emerald-600">
              <FileCheck className="w-2.5 h-2.5" />
              {evidenceCount}
            </span>
          )}
        </div>
      )}
    </div>
  );
});

InterventionMindmapNode.displayName = 'InterventionMindmapNode';

export default InterventionMindmapNode;
