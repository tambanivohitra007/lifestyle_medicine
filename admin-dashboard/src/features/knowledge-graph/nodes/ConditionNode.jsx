import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { AlertCircle } from 'lucide-react';

const ConditionNode = memo(({ data, selected }) => {
  const isCenter = data.isCenter;
  const isHighlighted = data.isHighlighted;

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-red-50
        ${isCenter ? 'ring-4 ring-red-200 ring-offset-2 scale-110' : ''}
        ${isHighlighted ? 'ring-4 ring-yellow-400 ring-offset-2 animate-pulse' : ''}
        ${selected ? 'shadow-xl scale-105 border-red-400' : 'border-red-200 hover:border-red-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '160px', maxWidth: '220px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-red-600 shadow-md flex-shrink-0">
          <AlertCircle className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-red-400 uppercase tracking-wide mb-0.5">
            Condition
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight line-clamp-2"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>

      {/* Category Badge */}
      {data.category && (
        <div className="mt-2 pt-2 border-t border-red-100">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-red-100 text-red-700">
            {data.category}
          </span>
        </div>
      )}

      {/* Center indicator */}
      {isCenter && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-md">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-white"
      />
    </div>
  );
});

ConditionNode.displayName = 'ConditionNode';

export default ConditionNode;
