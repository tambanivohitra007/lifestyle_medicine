import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react';

/**
 * Center condition node - the main focus of the mindmap
 * Now with expand/collapse capability
 */
const CenterConditionNode = memo(({ data, selected }) => {
  return (
    <div
      className={`
        relative px-6 py-4 rounded-2xl shadow-xl border-3 transition-all duration-300
        bg-gradient-to-br from-white via-red-50 to-red-100
        min-w-[200px] max-w-[280px]
        ${selected ? 'shadow-2xl scale-105 border-red-500' : 'border-red-300 hover:shadow-2xl hover:scale-102'}
        ${data.expanded ? 'ring-4 ring-red-200 ring-offset-2' : ''}
      `}
      style={{ borderWidth: '3px' }}
    >
      {/* Connection handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        className="!bg-red-400 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        className="!bg-red-400 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        className="!bg-red-400 !w-3 !h-3"
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        className="!bg-red-400 !w-3 !h-3"
      />

      {/* Pulsing ring indicator */}
      <div className="absolute -inset-2 rounded-2xl bg-red-200 opacity-30 animate-pulse" />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
            <AlertCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="text-[10px] font-bold text-red-500 uppercase tracking-wider">
              Condition
            </div>
            <div className="font-bold text-lg text-gray-800 leading-tight">
              {data.name || data.label}
            </div>
          </div>
        </div>

        {/* Category badge */}
        {data.category && (
          <div className="mt-3 pt-2 border-t border-red-200">
            <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
              {data.category}
            </span>
          </div>
        )}

        {/* Summary preview */}
        {data.summary && (
          <div className="mt-2 text-xs text-gray-600 line-clamp-2">
            {data.summary}
          </div>
        )}
      </div>

      {/* Center indicator */}
      <div className="absolute -top-3 -right-3 w-7 h-7 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
        <div className="w-2.5 h-2.5 bg-white rounded-full" />
      </div>

      {/* Expand/Collapse indicator with child count */}
      {data.expandable && data.childCount > 0 && (
        <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1">
          <div
            className="flex items-center gap-1 px-3 py-1 rounded-full bg-white border-2 border-red-300 shadow-md cursor-pointer hover:scale-105 transition-transform"
          >
            {data.expanded ? (
              <ChevronDown className="w-4 h-4 text-red-500" />
            ) : (
              <ChevronRight className="w-4 h-4 text-red-500" />
            )}
            <span className="text-xs font-bold text-red-600">
              {data.childCount}
            </span>
          </div>
        </div>
      )}
    </div>
  );
});

CenterConditionNode.displayName = 'CenterConditionNode';

export default CenterConditionNode;
