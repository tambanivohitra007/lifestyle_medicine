import { memo } from 'react';
import { Handle, Position } from 'reactflow';
import { Stethoscope } from 'lucide-react';

const InterventionNode = memo(({ data, selected }) => {
  const isCenter = data.isCenter;

  return (
    <div
      className={`
        group relative px-4 py-3 rounded-xl shadow-lg border-2 transition-all duration-200
        bg-gradient-to-br from-white to-rose-50
        ${isCenter ? 'ring-4 ring-rose-200 ring-offset-2 scale-110' : ''}
        ${selected ? 'shadow-xl scale-105 border-rose-400' : 'border-rose-200 hover:border-rose-300 hover:shadow-xl'}
      `}
      style={{ minWidth: '160px', maxWidth: '220px' }}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-rose-400 !border-2 !border-white"
      />

      {/* Header */}
      <div className="flex items-start gap-2.5">
        <div className="p-2 rounded-lg bg-gradient-to-br from-rose-500 to-pink-600 shadow-md flex-shrink-0">
          <Stethoscope className="w-4 h-4 text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide mb-0.5">
            Intervention
          </div>
          <div
            className="font-bold text-sm text-gray-900 leading-tight line-clamp-2"
            title={data.label}
          >
            {data.label}
          </div>
        </div>
      </div>

      {/* Care Domain Badge */}
      {data.careDomain && (
        <div className="mt-2 pt-2 border-t border-rose-100">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-100 text-blue-700">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
            {data.careDomain}
          </span>
        </div>
      )}

      {/* Center indicator */}
      {isCenter && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-rose-500 rounded-full flex items-center justify-center shadow-md">
          <div className="w-2 h-2 bg-white rounded-full"></div>
        </div>
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-rose-400 !border-2 !border-white"
      />
    </div>
  );
});

InterventionNode.displayName = 'InterventionNode';

export default InterventionNode;
